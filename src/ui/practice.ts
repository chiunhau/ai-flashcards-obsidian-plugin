import { App, Modal, Notice, Setting } from "obsidian";
import { FlashcardData } from "../types";

export class PracticeSetupModal extends Modal {
  private allCards: FlashcardData[];
  private wordClasses: string[];
  private groups: string[];
  private selectedClasses: Set<string>;
  private selectedGroup: string;
  private cardCount: number | "all";
  private order: "random" | "alphabetical";

  constructor(app: App, cards: FlashcardData[], wordClasses: string[], groups: string[]) {
    super(app);
    this.allCards = cards;
    this.wordClasses = wordClasses;
    this.groups = groups;
    this.selectedClasses = new Set(wordClasses);
    this.selectedGroup = "all";
    this.cardCount = 10;
    this.order = "random";
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("practice-setup-modal");
    contentEl.createEl("h2", { text: "Practice Flashcards" });
    contentEl.createEl("p", {
      text: `${this.allCards.length} flashcard(s) available`,
      cls: "practice-setup-subtitle",
    });

    // Card count
    new Setting(contentEl)
      .setName("Number of cards")
      .addDropdown((dd) => {
        dd.addOption("5", "5");
        dd.addOption("10", "10");
        dd.addOption("20", "20");
        dd.addOption("all", "All");
        dd.setValue("10");
        dd.onChange((v) => {
          this.cardCount = v === "all" ? "all" : parseInt(v);
        });
      });

    // Word class filter
    const wcSetting = new Setting(contentEl).setName("Word class");
    const wcContainer = wcSetting.controlEl.createDiv({ cls: "practice-wc-checkboxes" });
    for (const wc of this.wordClasses) {
      const label = wcContainer.createEl("label", { cls: "practice-wc-label" });
      const cb = label.createEl("input", { type: "checkbox" }) as HTMLInputElement;
      cb.checked = true;
      cb.addEventListener("change", () => {
        if (cb.checked) this.selectedClasses.add(wc);
        else this.selectedClasses.delete(wc);
      });
      label.appendText(" " + wc);
    }

    // Group filter
    if (this.groups.length > 1) {
      new Setting(contentEl)
        .setName("Group")
        .addDropdown((dd) => {
          dd.addOption("all", "All groups");
          for (const g of this.groups) {
            dd.addOption(g, g);
          }
          dd.setValue("all");
          dd.onChange((v) => {
            this.selectedGroup = v;
          });
        });
    }

    // Order
    new Setting(contentEl)
      .setName("Order")
      .addDropdown((dd) => {
        dd.addOption("random", "Random");
        dd.addOption("alphabetical", "Alphabetical");
        dd.setValue("random");
        dd.onChange((v) => {
          this.order = v as "random" | "alphabetical";
        });
      });

    // Start button
    const btnContainer = contentEl.createDiv({ cls: "modal-button-container" });
    btnContainer.createEl("button", { text: "Start", cls: "mod-cta" })
      .addEventListener("click", () => this.startPractice());
  }

  private startPractice() {
    let cards = this.allCards.filter((c) => this.selectedClasses.has(c.wordClass));

    if (this.selectedGroup !== "all") {
      cards = cards.filter((c) => c.group === this.selectedGroup);
    }

    if (cards.length === 0) {
      new Notice("No cards match the selected filters.");
      return;
    }

    if (this.order === "random") {
      cards = cards.sort(() => Math.random() - 0.5);
    } else {
      cards = cards.sort((a, b) => a.word.localeCompare(b.word));
    }

    if (this.cardCount !== "all") {
      cards = cards.slice(0, this.cardCount);
    }

    this.close();
    new PracticeModal(this.app, cards).open();
  }

  onClose() {
    this.contentEl.empty();
  }
}

export class PracticeModal extends Modal {
  private cards: FlashcardData[];
  private currentIndex: number;
  private results: ("know" | "dont_know")[];
  private isFlipped: boolean;
  private boundKeyHandler: (e: KeyboardEvent) => void;

  constructor(app: App, cards: FlashcardData[]) {
    super(app);
    this.cards = cards;
    this.currentIndex = 0;
    this.results = [];
    this.isFlipped = false;
    this.boundKeyHandler = this.handleKey.bind(this);
  }

  onOpen() {
    this.modalEl.addClass("practice-modal");
    document.addEventListener("keydown", this.boundKeyHandler);
    this.renderCard();
  }

  private handleKey(e: KeyboardEvent) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!this.isFlipped) this.flipCard();
    } else if (e.key === "ArrowRight" && this.isFlipped) {
      this.answer("know");
    } else if (e.key === "ArrowLeft" && this.isFlipped) {
      this.answer("dont_know");
    }
  }

  private renderCard() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("practice-content");

    const card = this.cards[this.currentIndex];
    const total = this.cards.length;
    const current = this.currentIndex + 1;

    // Progress
    const progressWrapper = contentEl.createDiv({ cls: "practice-progress" });
    progressWrapper.createEl("span", { text: `${current} / ${total}` });
    const bar = progressWrapper.createDiv({ cls: "practice-bar" });
    const fill = bar.createDiv({ cls: "practice-bar-fill" });
    fill.style.width = `${(current / total) * 100}%`;

    // Word class badge
    const badge = contentEl.createDiv({ cls: "practice-badge" });
    badge.setText(card.wordClass);

    // Card
    const cardEl = contentEl.createDiv({ cls: "practice-card" });
    cardEl.createEl("div", { text: card.word, cls: "practice-word" });

    if (!this.isFlipped) {
      const hint = contentEl.createDiv({ cls: "practice-hint" });
      hint.setText("Press Space or click to reveal");
      cardEl.addEventListener("click", () => this.flipCard());
      cardEl.style.cursor = "pointer";
    } else {
      cardEl.addClass("flipped");
      cardEl.createEl("div", { cls: "practice-divider" });
      cardEl.createEl("div", { text: card.translation, cls: "practice-translation" });

      // Load note body async
      this.app.vault.cachedRead(card.file).then((body) => {
        // Strip frontmatter
        const stripped = body.replace(/^---[\s\S]*?---\s*/, "").trim();
        if (stripped) {
          cardEl.createEl("div", { text: stripped, cls: "practice-note" });
        }
      });

      // Buttons
      const btns = contentEl.createDiv({ cls: "practice-buttons" });
      const dontKnowBtn = btns.createEl("button", { text: "✗  Don't know  ←", cls: "practice-btn-dont-know" });
      dontKnowBtn.addEventListener("click", () => this.answer("dont_know"));
      const knowBtn = btns.createEl("button", { text: "✓  Know it  →", cls: "practice-btn-know" });
      knowBtn.addEventListener("click", () => this.answer("know"));
    }
  }

  private flipCard() {
    this.isFlipped = true;
    this.renderCard();
  }

  private answer(result: "know" | "dont_know") {
    this.results.push(result);
    this.currentIndex++;
    this.isFlipped = false;

    if (this.currentIndex >= this.cards.length) {
      this.renderResults();
    } else {
      this.renderCard();
    }
  }

  private renderResults() {
    const { contentEl } = this;
    contentEl.empty();

    const known = this.results.filter((r) => r === "know").length;
    const total = this.cards.length;

    contentEl.createEl("h2", { text: "Session Complete!" });

    const scoreEl = contentEl.createDiv({ cls: "practice-score" });
    scoreEl.createEl("span", {
      text: `${known}`,
      cls: "practice-score-num",
    });
    scoreEl.createEl("span", { text: ` / ${total}` });

    // Score bar
    const bar = contentEl.createDiv({ cls: "practice-bar practice-bar-result" });
    const fill = bar.createDiv({ cls: "practice-bar-fill" });
    fill.style.width = `${(known / total) * 100}%`;

    // Missed words
    const missed = this.cards.filter((_, i) => this.results[i] === "dont_know");
    if (missed.length > 0) {
      contentEl.createEl("h3", { text: "Words to review" });
      const list = contentEl.createEl("ul", { cls: "practice-missed" });
      for (const card of missed) {
        const li = list.createEl("li");
        const link = li.createEl("a", {
          text: `${card.word}  →  ${card.translation}`,
          cls: "practice-missed-link",
        });
        link.addEventListener("click", (e) => {
          e.preventDefault();
          this.close();
          const leaf = this.app.workspace.getLeaf("tab");
          leaf.openFile(card.file);
        });
      }
    } else {
      contentEl.createEl("p", { text: "Perfect score! 🎉", cls: "practice-perfect" });
    }

    const btnContainer = contentEl.createDiv({ cls: "modal-button-container" });
    btnContainer.createEl("button", { text: "Close", cls: "mod-cta" })
      .addEventListener("click", () => this.close());
  }

  onClose() {
    document.removeEventListener("keydown", this.boundKeyHandler);
    this.contentEl.empty();
  }
}

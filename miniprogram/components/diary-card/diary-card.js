// components/diary-card/diary-card.js
Component({
  properties: {
    diary: { type: Object, value: {} },
    theme: { type: String, value: 'light' }
  },
  methods: {
    onTap() {
      this.triggerEvent('tap', { id: this.data.diary.id });
    },
    onDelete(e) {
      e.stopPropagation && e.stopPropagation();
      this.triggerEvent('delete', { id: this.data.diary.id });
    }
  }
});

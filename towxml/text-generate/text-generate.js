Component({
  properties: {
    words: {
      type: String,
      value: '',
      observer: function (newVal) {
        if (newVal) {
          this.setData({
            wordsArray: newVal.split(' '),
          });
          this.startAnimation();
        }
      },
    },
    duration: {
      type: Number,
      value: 0.5,
    },
    delay: {
      type: Number,
      value: 0.2,
    },
    blur: {
      type: Boolean,
      value: true,
    },
  },

  data: {
    wordsArray: [],
    animatedIndices: [],
  },

  methods: {
    startAnimation: function () {
      const { wordsArray, duration, delay } = this.data;
      if (!wordsArray.length) return;

      // 重置动画状态
      this.setData({ animatedIndices: [] });

      // 逐个为单词添加动画
      for (let i = 0; i < wordsArray.length; i++) {
        setTimeout(() => {
          let newIndices = this.data.animatedIndices.slice();
          newIndices.push(i);
          this.setData({
            animatedIndices: newIndices,
          });
        }, i * (delay * 1000));
      }
    },
  },

  attached: function () {
    if (this.data.words) {
      this.setData({
        wordsArray: this.data.words.split(' '),
      });
      this.startAnimation();
    }
  },
});

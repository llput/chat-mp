Component({
  options: {
    styleIsolation: 'shared',
  },
  properties: {
    loading: {
      observer(newVal) {
        if (!newVal) {
          this.setData({
            showNodes: this.properties.nodes,
          });
        }
      },
      type: Boolean,
      value: false,
    },
    nodes: {
      observer(newVal) {
        if (newVal && this.properties.loading) {
          const newNodes = (() => {
            try {
              return JSON.parse(JSON.stringify(newVal));
            } catch (error) {
              return [];
            }
          })();

          this.setData({
            showNodes: newNodes,
          });
        } else {
          this.setData({
            showNodes: newVal,
          });
        }
      },
      type: Object,
      value: [],
    },
    className: {
      type: String,
      value: '',
    },
  },
  data: {
    showNodes: [],
  },
});

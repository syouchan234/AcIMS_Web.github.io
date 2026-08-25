// jest-dom は DOM ノードを検証するためのカスタムマッチャーを追加します。
// 例: expect(element).toHaveTextContent(/react/i)
// 詳細: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';

// matchMedia のモック
window.matchMedia = window.matchMedia || function() {
  return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
  };
};

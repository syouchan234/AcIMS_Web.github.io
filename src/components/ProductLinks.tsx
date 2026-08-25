import './ProductLinks.css';

const PRODUCT_PAGE_URL = 'https://sites.google.com/view/tanakatechpublicapplication/home?authuser=0';

const ProductLinks: React.FC = () => (
  <footer className="product-links">
    <a href={PRODUCT_PAGE_URL} rel="noreferrer" target="_blank">AcIMS製品紹介ページ</a>
  </footer>
);

export default ProductLinks;

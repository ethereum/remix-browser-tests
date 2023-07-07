import { createRoot } from 'react-dom/client';
import App from './app';
import 'bootstrap/dist/css/bootstrap.css';

const domNode = document.getElementById('root');
const root = createRoot(domNode);

root.render(<App />);

import { render } from 'preact';
import { App } from './ui/App';
import './styles/global.css';

const appRoot = document.getElementById('app');
if (appRoot) {
  render(<App />, appRoot);
}

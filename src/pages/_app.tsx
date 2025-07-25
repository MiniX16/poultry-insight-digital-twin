import { LoteProvider } from '@/context/LoteContext';

export default function App({ Component, pageProps }) {
  return (
    <LoteProvider>
      <Component {...pageProps} />
    </LoteProvider>
  );
}

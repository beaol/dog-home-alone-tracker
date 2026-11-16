import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';
import { BASE_URL } from '../lib/site';

// Web-only root HTML used during static rendering (runs in Node, no DOM access).
export default function Root({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();

  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Home Alone Trainer</title>
        <meta name="description" content="Track your dog's home alone training and get the next step, based on trusted sources." />

        {/* Installable on iPhone: Share → Add to Home Screen */}
        <link rel="manifest" href={`${BASE_URL}/manifest.json`} />
        <link rel="apple-touch-icon" href={`${BASE_URL}/apple-touch-icon.png`} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Home Alone" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#f4f3ef" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#111110" media="(prefers-color-scheme: dark)" />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: css }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}

const css = `
body { background-color: #f4f3ef; -webkit-tap-highlight-color: transparent; }
@media (prefers-color-scheme: dark) { body { background-color: #111110; } }
`;

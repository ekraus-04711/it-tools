import { Link } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'URL unshortener',
  path: '/url-unshortener',
  description: 'Expand shortened URLs and reveal their redirect chain',
  keywords: ['url', 'short', 'unshorten', 'expand', 'redirect'],
  component: () => import('./url-unshortener.vue'),
  icon: Link,
  createdAt: new Date('2024-06-30'),
});

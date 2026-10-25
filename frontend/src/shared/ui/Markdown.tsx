import { cn } from './cn';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
export const Markdown = ({ text }: { text: string }) => {
  return (
    <div
      className={cn(
        'markdown text-sm leading-[1.65] wrap-anywhere text-[#344563] [&_h1]:text-[26px]',
        '[&_h1]:leading-9 [&_h1]:mb-3.5 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mx-0',
        '[&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mx-0 [&_h3]:mb-[7px]',
        '[&_p]:[white-space:pre-wrap] [&>:first-child]:mt-0 [&>:last-child]:mb-0',
        '[&_a]:text-[var(--blue,_#0c66e4)] [&_a]:underline [&_pre]:p-3.5 [&_pre]:overflow-auto',
        '[&_pre]:rounded-[5px] [&_pre]:bg-[#f1f2f4] [&_code]:font-mono [&_code]:text-[.9em]',
        '[&_:not(pre)>code]:bg-[#f1f2f4] [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:px-1',
        '[&_:not(pre)>code]:rounded-[3px] [&_blockquote]:ml-0 [&_blockquote]:pl-3.5',
        '[&_blockquote]:border-l-3 [&_blockquote]:border-[#b3b9c4] [&_blockquote]:text-[#626f86]',
        '[&_table]:block [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:max-w-full',
        '[&_th]:border [&_th]:border-[#dcdfe4] [&_th]:py-[7px] [&_th]:px-2.5 [&_td]:border',
        '[&_td]:border-[#dcdfe4] [&_td]:py-[7px] [&_td]:px-2.5 [&_ul]:pl-5.5 [&_ol]:pl-5.5',
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <a
              href={typeof src === 'string' ? src : undefined}
              target="_blank"
              rel="noopener noreferrer"
            >
              {alt || 'Изображение'}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

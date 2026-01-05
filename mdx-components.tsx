import type { MDXComponents } from 'mdx/types';

const components: MDXComponents = {
  h1: (props) => (
    <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4 first:mt-0" {...props} />
  ),
  h2: (props) => (
    <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3" {...props} />
  ),
  h3: (props) => (
    <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2" {...props} />
  ),
  p: (props) => (
    <p className="text-gray-700 mb-4 leading-relaxed" {...props} />
  ),
  ul: (props) => (
    <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4" {...props} />
  ),
  ol: (props) => (
    <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-2 ml-4" {...props} />
  ),
  li: (props) => (
    <li className="text-gray-700" {...props} />
  ),
  strong: (props) => (
    <strong className="font-semibold text-gray-900" {...props} />
  ),
  em: (props) => (
    <em className="italic" {...props} />
  ),
  code: (props) => (
    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800" {...props} />
  ),
  blockquote: (props) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4" {...props} />
  ),
};

export function useMDXComponents(userComponents: MDXComponents): MDXComponents {
  return { ...components, ...userComponents };
}

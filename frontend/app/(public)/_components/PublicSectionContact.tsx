export function PublicSectionContact() {
  return (
    <section className="bg-gray-50/50">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-xl font-semibold text-gray-900">Contact</h2>
          <p className="mt-4 text-gray-600">
            Have a question about a piece, an order, or partnering with Fefe
            Ave? Reach out and we&apos;ll get back to you as soon as we can.
          </p>
          <ul
            className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6 space-y-4 text-sm"
            role="list"
            aria-label="Contact options"
          >
            <li className="flex items-center gap-3">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center text-gray-500"
                aria-hidden
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </span>
              <a
                href="mailto:fefeave@outlook.com"
                className="text-gray-900 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 rounded"
              >
                fefeave@outlook.com
              </a>
            </li>
            <li className="flex items-center gap-3">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center text-gray-500"
                aria-hidden
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.919 0 3.204-.012 3.584-.069 4.919-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.919.07-3.204 0-3.584-.012-4.919-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.919 0-3.204.013-3.584.07-4.919.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.919-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </span>
              <a
                href="https://instagram.com/fefe_ave"
                target="_blank"
                rel="noreferrer"
                className="text-gray-900 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 rounded"
              >
                @fefe_ave on Instagram
              </a>
            </li>
            <li className="flex items-center gap-3">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center text-gray-500"
                aria-hidden
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </span>
              <a
                href="https://whatnot.com/user/fefe_ave"
                target="_blank"
                rel="noreferrer"
                className="text-gray-900 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 rounded"
              >
                fefe_ave on Whatnot
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

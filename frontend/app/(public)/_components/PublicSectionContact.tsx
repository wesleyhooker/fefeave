export function PublicSectionContact() {
  return (
    <section className="bg-gray-50/50">
      <div className="mx-auto max-w-2xl px-4 py-14 sm:py-16">
        <h2 className="text-xl font-semibold text-gray-900">Contact</h2>
        <p className="mt-4 text-gray-600">
          Have a question about a piece, an order, or partnering with Fefe Ave?
          Reach out and we&apos;ll get back to you as soon as we can.
        </p>
        <ul className="mt-6 space-y-2 text-sm text-gray-600">
          <li>
            <span className="text-gray-400">Email:</span>{" "}
            <a
              href="mailto:fefeave@outlook.com"
              className="text-gray-900 underline hover:no-underline"
            >
              fefeave@outlook.com
            </a>
          </li>
          <li>
            <span className="text-gray-400">Social:</span>{" "}
            <span className="text-gray-500">
              Follow{" "}
              <a
                href="https://instagram.com/fefe_ave"
                target="_blank"
                rel="noreferrer"
                className="underline hover:no-underline"
              >
                @fefe_ave on Instagram
              </a>{" "}
              and{" "}
              <a
                href="https://whatnot.com/user/fefe_ave"
                target="_blank"
                rel="noreferrer"
                className="underline hover:no-underline"
              >
                fefe_ave on Whatnot
              </a>
              .
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}

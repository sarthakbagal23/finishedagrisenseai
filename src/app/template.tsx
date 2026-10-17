export default function Template({ children }: { children: React.ReactNode }) {
  // No page-wide fade: content must be readable the moment it renders.
  return <div className="figure-enter">{children}</div>;
}

import Link from 'next/link';

const navItems = [
  { href: '/', label: '首页' },
  { href: '/zt', label: '涨停榜' },
  { href: '/sector', label: '板块热点' },
  { href: '/lhb', label: '龙虎榜' },
  { href: '/about', label: '关于' },
];

export default function Navbar() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/" className="mr-6 text-lg font-bold">
          A股热点
        </Link>
        <div className="flex gap-4">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

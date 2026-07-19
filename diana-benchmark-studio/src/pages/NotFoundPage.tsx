import { Link } from "react-router-dom";
export function NotFoundPage() { return <main id="main-content" className="not-found"><p className="eyebrow">404 / Route not found</p><h1>This protocol path does not exist.</h1><p>The Studio has not changed your current benchmark.</p><Link className="primary-action" to="/">Return home</Link></main>; }

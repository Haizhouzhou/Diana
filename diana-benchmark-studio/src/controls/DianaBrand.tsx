import { Link } from "react-router-dom";
import dianaWordmark from "../assets/brand/diana-wordmark.svg";

export function DianaBrand() {
  return <Link className="brand-link" to="/" aria-label="Diana Benchmark Studio home"><img src={dianaWordmark} width="102" height="41" alt="Diana" /><span>Benchmark Studio</span></Link>;
}

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Header.module.css";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UsageWidget } from "@/components/ui/UsageWidget";
import { Button } from "@/components/ui/Button";

export const Header: React.FC = () => {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label="Eventoria Home">
          <div className={styles.logoIcon} aria-hidden="true">
            ✨
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Eventoria</span>
            <span className={styles.brandSubtitle}>Celebration AI</span>
          </div>
        </Link>

        <nav className={styles.nav} aria-label="Main Navigation">
          <Link
            href="/"
            className={`${styles.navLink} ${pathname === "/" ? styles.navLinkActive : ""}`}
          >
            Overview
          </Link>
          <Link
            href="/planner"
            className={`${styles.navLink} ${pathname === "/planner" ? styles.navLinkActive : ""}`}
          >
            Planner
          </Link>
          <Link
            href="/chat"
            className={`${styles.navLink} ${pathname === "/chat" ? styles.navLinkActive : ""}`}
          >
            AI Assistant
          </Link>
        </nav>

        <div className={styles.actions}>
          <UsageWidget />
          <ThemeToggle />
          <Link href="/planner" tabIndex={-1}>
            <Button size="sm" variant="primary">
              Plan Event
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

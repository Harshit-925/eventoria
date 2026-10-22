"use client";

import React, { useState } from "react";
import styles from "./EventPlanForm.module.css";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCurrencyINR } from "@/lib/format";
import { LIMITS } from "@/lib/constants";
import type { EventPlanRequest, EventType } from "@/types/event";

export interface EventPlanFormProps {
  readonly onSubmit: (request: EventPlanRequest) => Promise<void>;
  readonly isLoading: boolean;
  readonly initialEventType?: EventType;
}

const PRESET_PLANS: ReadonlyArray<{
  readonly name: string;
  readonly request: EventPlanRequest;
}> = [
  {
    name: "👑 Royal Palace Wedding (250 guests, ₹20 Lakh)",
    request: {
      eventType: "wedding",
      guestCount: 250,
      budget: 2000000,
      date: "2026-11-20",
      city: "Jaipur",
      description: "A grand traditional wedding with regal mandap decor, authentic Rajasthani catering, and live folk music.",
      preferences: ["Pure vegetarian menu", "Royal traditional decor", "Live acoustic shehnai", "Drone photography"],
    },
  },
  {
    name: "🎈 10th Superhero Birthday (40 guests, ₹60,000)",
    request: {
      eventType: "birthday",
      guestCount: 40,
      budget: 60000,
      date: "2026-09-12",
      city: "Bengaluru",
      description: "Fun, vibrant superhero-themed party for kids with games, DIY craft stations, and custom tiered cake.",
      preferences: ["Superhero theme", "Cupcake station", "Magic show & games", "Custom return favors"],
    },
  },
  {
    name: "🎪 Diwali Community Mela (500 guests, ₹4.5 Lakh)",
    request: {
      eventType: "community",
      guestCount: 500,
      budget: 450000,
      date: "2026-10-31",
      city: "Delhi",
      description: "Festive neighborhood festival with food stalls, diyas, cultural dance performances, and community lighting.",
      preferences: ["Eco-friendly decor", "Stage & AV sound system", "First aid & safety station", "Volunteer badges"],
    },
  },
];

const SUGGESTED_TAGS: Record<EventType, ReadonlyArray<string>> = {
  wedding: [
    "Pure vegetarian catering",
    "Outdoor garden lawn",
    "Live classical shehnai",
    "Drone cinematography",
    "Sangeet choreographer",
    "Eco-friendly favors",
  ],
  birthday: [
    "Interactive magic show",
    "Custom designer cake",
    "Polaroid photo booth",
    "DIY arts & crafts table",
    "Themed return favors",
    "DJ & dance party",
  ],
  community: [
    "Local artisan food stalls",
    "Stage & PA sound system",
    "First aid & hydration booths",
    "Volunteer badges & walkies",
    "Eco-friendly waste management",
    "Cultural dance showcase",
  ],
};

export const EventPlanForm: React.FC<EventPlanFormProps> = ({
  onSubmit,
  isLoading,
  initialEventType = "wedding",
}) => {
  const [eventType, setEventType] = useState<EventType>(initialEventType);
  const [guestCount, setGuestCount] = useState<number>(150);
  const [budget, setBudget] = useState<number>(1200000);
  const [date, setDate] = useState<string>("2026-12-15");
  const [city, setCity] = useState<string>("Bengaluru");
  const [description, setDescription] = useState<string>("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const handleApplyPreset = (preset: typeof PRESET_PLANS[0]) => {
    setEventType(preset.request.eventType);
    setGuestCount(preset.request.guestCount);
    setBudget(preset.request.budget);
    setDate(preset.request.date);
    setCity(preset.request.city);
    setDescription(preset.request.description);
    setPreferences([...preset.request.preferences]);
    setFormError(null);
  };

  const togglePreference = (tag: string) => {
    setPreferences((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!city.trim()) {
      setFormError("Please provide an event location / city.");
      return;
    }

    if (guestCount < LIMITS.MIN_GUESTS || guestCount > LIMITS.MAX_GUESTS) {
      setFormError(`Guest count must be between ${LIMITS.MIN_GUESTS} and ${LIMITS.MAX_GUESTS}.`);
      return;
    }

    if (budget < LIMITS.MIN_BUDGET || budget > LIMITS.MAX_BUDGET) {
      setFormError(`Budget must be between INR ${LIMITS.MIN_BUDGET} and INR ${LIMITS.MAX_BUDGET}.`);
      return;
    }

    const payload: EventPlanRequest = {
      eventType,
      guestCount,
      budget,
      date,
      city: city.trim(),
      description: description.trim(),
      preferences,
    };

    await onSubmit(payload);
  };

  const compactBudget = formatCurrencyINR(budget, { compact: true });
  const fullBudget = formatCurrencyINR(budget);

  return (
    <Card className={styles.formContainer}>
      {/* 1-Click Demo Presets */}
      <div className={styles.presetBar}>
        <span className={styles.presetLabel}>Quick Demonstration Presets:</span>
        <div className={styles.presetChips}>
          {PRESET_PLANS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              className={styles.presetChip}
              onClick={() => handleApplyPreset(preset)}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {formError && (
        <div className={styles.errorMessageAlert} role="alert">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Step 1: Event Type */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionHeading}>
            <span aria-hidden="true">1️⃣</span> Select Celebration Type
          </h2>
          <div className={styles.typeGrid} role="radiogroup" aria-label="Celebration type">
            <button
              type="button"
              role="radio"
              aria-checked={eventType === "wedding"}
              className={`${styles.typeButton} ${
                eventType === "wedding" ? styles.typeButtonSelected : ""
              }`}
              onClick={() => setEventType("wedding")}
            >
              <span className={styles.typeIcon} aria-hidden="true">
                💍
              </span>
              <span className={styles.typeTitle}>Wedding</span>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={eventType === "birthday"}
              className={`${styles.typeButton} ${
                eventType === "birthday" ? styles.typeButtonSelected : ""
              }`}
              onClick={() => setEventType("birthday")}
            >
              <span className={styles.typeIcon} aria-hidden="true">
                🎂
              </span>
              <span className={styles.typeTitle}>Birthday</span>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={eventType === "community"}
              className={`${styles.typeButton} ${
                eventType === "community" ? styles.typeButtonSelected : ""
              }`}
              onClick={() => setEventType("community")}
            >
              <span className={styles.typeIcon} aria-hidden="true">
                🎪
              </span>
              <span className={styles.typeTitle}>Community</span>
            </button>
          </div>
        </div>

        {/* Step 2: Numbers & Logistics */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionHeading}>
            <span aria-hidden="true">2️⃣</span> Scale, Budget & Venue
          </h2>
          <div className={styles.inputGrid}>
            <div className={styles.fieldGroup}>
              <label htmlFor="guest-count" className={styles.label}>
                Guest Count <span className={styles.requiredMark}>*</span>
              </label>
              <input
                id="guest-count"
                type="number"
                min={LIMITS.MIN_GUESTS}
                max={LIMITS.MAX_GUESTS}
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className={styles.input}
                required
              />
              <span className={styles.helperText}>Approximate attendee headcount</span>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="budget" className={styles.label}>
                Total Budget (INR) <span className={styles.requiredMark}>*</span>
              </label>
              <input
                id="budget"
                type="number"
                step="5000"
                min={LIMITS.MIN_BUDGET}
                max={LIMITS.MAX_BUDGET}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className={styles.input}
                required
              />
              <span className={styles.helperText}>
                Preview: <strong>{fullBudget}</strong> ({compactBudget})
              </span>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="event-date" className={styles.label}>
                Target Event Date <span className={styles.requiredMark}>*</span>
              </label>
              <input
                id="event-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="event-city" className={styles.label}>
                Destination / City <span className={styles.requiredMark}>*</span>
              </label>
              <input
                id="event-city"
                type="text"
                placeholder="e.g. Bengaluru, Jaipur, Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={styles.input}
                required
              />
            </div>
          </div>
        </div>

        {/* Step 3: Vision & Preferences */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionHeading}>
            <span aria-hidden="true">3️⃣</span> Vision & Custom Preferences
          </h2>
          <div className={styles.fieldGroup} style={{ marginBottom: "var(--space-4)" }}>
            <label htmlFor="description" className={styles.label}>
              Event Vision or Special Notes
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Describe your desired ambiance, cultural rituals, dietary constraints, or themes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
              maxLength={LIMITS.MAX_DESCRIPTION_LENGTH}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Quick Preference Tags</label>
            <div className={styles.tagCloud}>
              {SUGGESTED_TAGS[eventType].map((tag) => {
                const isActive = preferences.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`${styles.tagButton} ${isActive ? styles.tagButtonActive : ""}`}
                    onClick={() => togglePreference(tag)}
                  >
                    {isActive ? "✓ " : "+ "}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
        >
          {isLoading ? "Generating Comprehensive Plan..." : "Generate Celebration Plan ✨"}
        </Button>
      </form>
    </Card>
  );
};

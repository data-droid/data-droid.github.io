---
layout: post
lang: en
title: "Building iOS Apps with AI Coding Agents - My Recipe Book & Coffee Journal Journey"
description: "I had zero iOS development experience. Using Flexibility AI for market research and feature specification, and Cursor for development, I built Recipe Book and Coffee Journal apps. Here's the full story."
date: 2026-03-23
author: Data Droid
category: infrastructure-tools
tags: [Cursor, Flexibility-AI, iOS, Swift, SwiftUI, AI-Coding-Agent, Side-Project, Mobile-App]
reading_time: "35 min"
difficulty: "Beginner"
---

# Building iOS Apps with AI Coding Agents - My Recipe Book & Coffee Journal Journey

> "The productivity app market is shrinking. The era of individuals building their own apps has arrived."

With the rapid advances in AI coding agents, this narrative has become common. The App Store is full of recipe apps, coffee journal apps, and to-do apps — but none fit my exact needs, and the ones that come close often have bloated features and subscription fees. So I decided to **build the apps I wanted to use myself**. The result: **Recipe Book** and **Coffee Journal**.

What’s notable is that I had **zero prior iOS development experience**. I didn’t know Swift, Xcode, or SwiftUI. Yet I was able to use **Flexibility AI** to research the market and define features, and **Cursor** to implement the apps. It wasn’t as hard as I expected. This post is a summary of that journey.

---

## Table of Contents {#toc}

- [Why the Era of Personal App Development?](#why-now)
- [Prep Phase - Flexibility AI for Market Research and Feature Definition](#flexibility-ai)
- [Development Tool - Cursor](#cursor-dev)
- [Recipe Book App](#recipe-book)
- [Coffee Journal App](#coffee-journal)
- [Iteration - Develop, Test, Refine](#iteration)
- [Why It Worked Despite No Experience](#why-it-worked)
- [Conclusion](#conclusion)

---

## Why the Era of Personal App Development? {#why-now}

### How the Productivity App Market Is Changing

The App Store already has thousands of recipe apps, note apps, and coffee brewing journals. But often what users want is **just enough features for their own use**. Off-the-shelf apps tend to be:

- Cluttered with features they don’t need
- Tied to subscription models that feel heavy
- Structured in ways that don’t fit their workflow

### Democratization via AI Coding Agents

Meanwhile, AI coding agents (Cursor, GitHub Copilot, etc.) have made it possible for **individuals to build full-featured apps in a short time**. If you have an idea, you don’t need to be a professional developer — you can build an app by talking to AI.

So I decided to turn my personal needs (“organize recipes my way,” “record coffee extractions simply”) into **real apps**.

---

## Prep Phase - Flexibility AI for Market Research and Feature Definition {#flexibility-ai}

Before writing code, it’s important to **define what you’re building**. I used **Flexibility AI** for this phase.

### What is Flexibility AI?

Flexibility AI helps with market research, planning, and feature definition. It was useful for questions like “What features do recipe apps typically have?” and “What’s trending in coffee journal apps?” and for turning rough ideas into concrete app scope.

### Using It for Market Research

I asked Flexibility AI things like:

- What features do existing recipe apps offer?
- What do users care about most in recipe apps?
- Trends and common features in coffee journal/brewing apps
- A minimal feature set suitable for a personal MVP

This helped separate **features I could skip** from **features I really needed**.

### Feature Specification

Based on the research:

- **Recipe Book**: Add/edit/delete recipes, categories, ingredient lists, cooking steps, search
- **Coffee Journal**: Bean info, extraction parameters (grind, water temp, time), taste notes, date

I listed features and prioritized what belonged in the first version vs. what could wait.

### Why This Phase Lowered Development Difficulty

Having a clear plan meant my requests to Cursor were precise: “add this,” “change that.” Market research and feature specification acted as a **compass** for development.

---

## Development Tool - Cursor {#cursor-dev}

I used **Cursor** for the actual implementation. I didn’t know Swift, SwiftUI, or Xcode project structure, but Cursor generated and modified code step by step until the apps were done.

### How I Worked with Cursor

1. **Project setup**: “Create an iOS app project with SwiftUI that stores recipes and shows them in a list.” — That single sentence gave me the basic structure.
2. **Adding features**: “Add a category field to recipes and enable filtering by category.” — Cursor produced the logic and UI.
3. **Bug fixing**: “Data disappears when I close and reopen the app.” — Describing the symptom was enough to get root cause analysis and fixes.

### SwiftUI and Local Storage

The apps are built with SwiftUI and store data locally (e.g., UserDefaults or SwiftData). I started with **fully local apps** and no backend, which kept the initial development simple.

### Why It Worked Without Experience

Cursor generated Swift/SwiftUI syntax, view hierarchy, and state management patterns, so I only needed a rough understanding of what the code did. Deep iOS expertise wasn’t required; **clearly communicating requirements** mattered more.

---

## Recipe Book App {#recipe-book}

### Purpose

A personal recipe collection — store your own recipes and find them quickly when needed. No sharing, social features, or subscriptions; just **my own recipe library**.

### Main Features (Based on Market Research)

- **Add recipes**: Title, ingredients, steps, category (e.g., Korean, Western, snacks)
- **List view**: Card or list layout
- **Search/filter**: By title, ingredients, or category
- **Detail view**: Tap to see the full recipe
- **Edit/delete**: Update or remove recipes

### Issues I Hit and How I Resolved Them

- **Data persistence**: Data vanished after closing the app — fixed by adjusting local storage setup with Cursor’s help
- **UI tweaks**: Buttons, fonts, layout looked different across devices — addressed with SwiftUI’s adaptive layout

### Result

I ended up with a lightweight Recipe Book that has exactly the features I need. Simpler than most store apps, but **enough for my use**.

---

## Coffee Journal App {#coffee-journal}

### Purpose

Record each brew: bean, extraction conditions, and taste. Useful when I want to recall “how did I brew that coffee last time?”

### Main Features

- **Add entries**: Bean name, roastery, grind, water temp, brew time, taste notes
- **List view**: Ordered by date or bean
- **Detail view**: Full info for each extraction

### Similarities and Differences with Recipe Book

**Similar:**
- SwiftUI, local storage
- Flow: list → detail → add/edit
- Fast prototyping with Cursor

**Different:**
- Recipe Book has long text (ingredients, steps); Coffee Journal has many short fields
- Date/bean-based sorting matters more in Coffee Journal

Both apps shared similar patterns, so what I learned from Recipe Book was reusable in Coffee Journal.

---

## Iteration - Develop, Test, Refine {#iteration}

The apps weren’t built in one shot. I repeated: **develop → test on simulator/device → find issues → ask Cursor to fix → test again**.

### How Cursor Speeded Up the Loop

1. **Straightforward change requests**: “This button should save, but it doesn’t” — describing the behavior was enough for Cursor to diagnose and suggest fixes
2. **Incremental improvements**: Add features one at a time and test; smaller requests led to more accurate responses
3. **Error message interpretation**: When Xcode showed build errors, pasting them into Cursor produced explanations and solutions

This loop took the apps from prototype to something **actually usable**.

---

## Why It Worked Despite No Experience {#why-it-worked}

### Flexibility AI: Define What to Build First

Because I had done market research and feature spec first, I never felt lost about “why am I building this?” There was a **clear spec**, and I only had to hand it to Cursor.

### Cursor: Turn Spec into Code

Cursor doesn’t decide what to build, but it can generate code for “build it like this.” The spec from Flexibility AI became Cursor’s input, and that combination worked well.

### The AI Combo Softened the Learning Curve

Learning Swift, SwiftUI, and iOS app structure from scratch would have taken a lot of time. With AI agents, I could **learn and build in parallel**, using a “make it work first, understand later” approach.

---

## Conclusion {#conclusion}

“The productivity app market will disappear” might be an overstatement. But **it’s much easier than before for individuals to build the apps they need**.

Using Flexibility AI for market research and feature definition, and Cursor for implementation, I built **Recipe Book** and **Coffee Journal** with no prior iOS experience. It wasn’t overwhelmingly difficult, and the satisfaction of building exactly what I wanted was real.

If you have an idea for an app you’d like on your phone, it’s worth a try. All you need is Flexibility AI, Cursor, and a simple loop: develop, test, refine.

---

*This post shares a personal experience of building apps with AI coding agents. Recipe Book and Coffee Journal were built for personal use.*

# SemiSharp Shared Strategy Context Design

Date: July 14, 2026  
Version: V3.0  
Status: Approved for Backend Implementation

## Purpose

Every survivor strategy needs the same validated operational information before making decisions.

Currently, individual strategies independently query application context, contest legs, survivor entries, and used-team history. This duplicates logic and risks inconsistent assumptions.

SemiSharp will introduce one shared backend object:

`StrategyContext`

The backend will assemble it once for a selected entry and contest format, then pass it to the strategy engine.

## Core Principle

Strategy Context describes the current decision environment.

It does not:

- rank teams
- calculate probabilities
- calculate risk
- generate recommendations
- contain strategy-specific scoring logic

## Context Composition

```text
Application Context
        +
Contest Context
        +
Entry Context
        =
Strategy Context

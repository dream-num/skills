#!/usr/bin/env python3

import argparse
import csv
import re
import sys


CELL_RE = re.compile(r"^([A-Z]+)([1-9][0-9]*)$")


def fail(message):
    print(message, file=sys.stderr)
    raise SystemExit(1)


def cell_to_index(cell):
    match = CELL_RE.fullmatch(cell)
    if not match:
        fail(f"invalid cell reference: {cell}")
    col_letters, row_text = match.groups()
    col = 0
    for ch in col_letters:
        col = col * 26 + (ord(ch) - ord("A") + 1)
    return int(row_text) - 1, col - 1


def read_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.reader(f))


def get_value(rows, cell):
    row_index, col_index = cell_to_index(cell)
    if row_index >= len(rows):
        fail(f"row out of range for {cell}")
    row = rows[row_index]
    if col_index >= len(row):
        fail(f"column out of range for {cell}")
    return row[col_index]


def parse_expect(spec):
    if "=" not in spec:
        fail(f"expected CELL=value format, got: {spec}")
    cell, value = spec.split("=", 1)
    return cell, value


def main():
    parser = argparse.ArgumentParser(description="Assert exact and non-empty cells in a CSV snippet.")
    parser.add_argument("csv_path")
    parser.add_argument("--expect", action="append", default=[], help="CELL=value")
    parser.add_argument("--non-empty", action="append", default=[])
    args = parser.parse_args()

    rows = read_csv(args.csv_path)
    if not rows:
        fail(f"CSV is empty: {args.csv_path}")

    for spec in args.expect:
        cell, expected = parse_expect(spec)
        actual = get_value(rows, cell)
        if actual != expected:
            fail(f"{cell} mismatch: expected {expected!r}, actual {actual!r}")

    for cell in args.non_empty:
        actual = get_value(rows, cell)
        if actual.strip() == "":
            fail(f"{cell} is empty")

    print("CSV cell checks passed.")


if __name__ == "__main__":
    main()

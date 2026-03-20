#!/usr/bin/env python3

import argparse
import csv
import sys


def read_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.reader(f))


def fail(message):
    print(message, file=sys.stderr)
    raise SystemExit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Compare CSV header and first N data rows, optionally checking a key column."
    )
    parser.add_argument("--expected", required=True)
    parser.add_argument("--actual", required=True)
    parser.add_argument("--rows", type=int, default=3, help="Number of data rows to compare")
    parser.add_argument("--key-column", default="")
    args = parser.parse_args()

    expected = read_csv(args.expected)
    actual = read_csv(args.actual)

    if not expected:
        fail(f"expected CSV is empty: {args.expected}")
    if not actual:
        fail(f"actual CSV is empty: {args.actual}")

    expected_header = expected[0]
    actual_header = actual[0]
    if expected_header != actual_header:
        fail(
            "header mismatch\n"
            f"expected: {expected_header}\n"
            f"actual:   {actual_header}"
        )

    expected_data = expected[1:]
    actual_data = actual[1:]
    if len(actual_data) < args.rows:
        fail(f"actual CSV has only {len(actual_data)} data rows, need at least {args.rows}")
    if len(expected_data) < args.rows:
        fail(f"expected CSV has only {len(expected_data)} data rows, need at least {args.rows}")

    for offset in range(args.rows):
        expected_row = expected_data[offset]
        actual_row = actual_data[offset]
        if expected_row != actual_row:
            fail(
                f"row {offset + 2} mismatch\n"
                f"expected: {expected_row}\n"
                f"actual:   {actual_row}"
            )

    if args.key_column:
        try:
            expected_key_index = expected_header.index(args.key_column)
            actual_key_index = actual_header.index(args.key_column)
        except ValueError:
            fail(f"key column not found in header: {args.key_column}")

        expected_keys = [row[expected_key_index] for row in expected_data[: args.rows]]
        actual_keys = [row[actual_key_index] for row in actual_data[: args.rows]]
        if expected_keys != actual_keys:
            fail(
                "key-column mismatch\n"
                f"column:   {args.key_column}\n"
                f"expected: {expected_keys}\n"
                f"actual:   {actual_keys}"
            )

    print(
        f"CSV preview verification passed: header + first {args.rows} data rows"
        + (f" + key column {args.key_column}" if args.key_column else "")
    )


if __name__ == "__main__":
    main()

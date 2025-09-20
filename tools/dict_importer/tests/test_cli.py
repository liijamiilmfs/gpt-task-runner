"""Tests for the dict_importer CLI commands."""

from pathlib import Path
from types import SimpleNamespace

from click.testing import CliRunner

from dict_importer.cli import cli


def test_build_command_dump_csv(tmp_path, monkeypatch):
    """The build command should copy ALL_ROWS.csv to the requested dump path."""

    pdf_path = tmp_path / "source.pdf"
    pdf_path.write_bytes(b"%PDF-1.4")
    output_dir = tmp_path / "output"
    requested_dump = tmp_path / "exports" / "all_rows.csv"

    def fake_parse_pdf_pages(path):
        assert Path(path) == pdf_path
        return ["dummy-page"]

    def fake_build_dictionaries(parsed_pages, destination, exclude_terms):
        assert parsed_pages == ["dummy-page"]
        destination.mkdir(parents=True, exist_ok=True)
        (destination / "ALL_ROWS.csv").write_text("English,Ancient\nfoo,bar\n")
        return SimpleNamespace(
            ancient_entries={"foo": "bar"},
            modern_entries={"foo": "modern"},
            excluded_entries=[],
            variant_entries=[],
        )

    monkeypatch.setattr("dict_importer.cli.parse_libran_pdf_pages", fake_parse_pdf_pages)
    monkeypatch.setattr(
        "dict_importer.cli.build_dictionaries", fake_build_dictionaries
    )

    runner = CliRunner()
    result = runner.invoke(
        cli,
        [
            "build",
            "--pdf",
            str(pdf_path),
            "--out",
            str(output_dir),
            "--dump-csv",
            str(requested_dump),
        ],
    )

    assert result.exit_code == 0, result.output
    assert requested_dump.exists()
    assert requested_dump.read_text() == "English,Ancient\nfoo,bar\n"

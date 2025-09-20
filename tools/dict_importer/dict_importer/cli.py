"""CLI interface for dictionary importer."""

import shutil
from pathlib import Path
from typing import Optional

import click

from .parse_tables import parse_pdf_pages
from .libran_parser import parse_libran_pdf_pages
from .json_importer import JSONDictionaryImporter, import_json_dictionaries, create_sample_json_dictionary
from .libran_json_importer import import_libran_dictionary
from .build_dicts import build_dictionaries
from .logging_config import get_logger, structured_logger


@click.group()
def cli():
    """Librán Dictionary Importer CLI."""
    pass


@cli.command()
@click.option('--pdf', required=True, help='Path to main PDF file')
@click.option('--out', required=True, help='Output directory for dictionaries')
@click.option('--support', help='Path to support PDF file (optional)')
@click.option('--exclude-list', help='Path to exclude terms file (optional)')
@click.option('--dump-csv', help='Path to dump all rows CSV (optional)')
def build(pdf: str, out: str, support: Optional[str] = None, 
          exclude_list: Optional[str] = None, dump_csv: Optional[str] = None):
    """Build dictionaries from PDF files."""
    logger = get_logger('cli.build')
    
    # Validate inputs
    pdf_path = Path(pdf)
    if not pdf_path.exists():
        logger.error(f"PDF file not found: {pdf}")
        click.echo(f"Error: PDF file not found: {pdf}", err=True)
        return
    
    output_dir = Path(out)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Load exclude terms
    exclude_terms = set()
    if exclude_list:
        exclude_path = Path(exclude_list)
        if exclude_path.exists():
            with open(exclude_path, 'r', encoding='utf-8') as f:
                exclude_terms = {line.strip().lower() for line in f if line.strip()}
        else:
            click.echo(f"Warning: Exclude list file not found: {exclude_list}")
    
    click.echo("Starting dictionary build...")
    click.echo(f"PDF: {pdf_path}")
    click.echo(f"Output: {output_dir}")
    if support:
        click.echo(f"Support PDF: {support}")
    if exclude_terms:
        click.echo(f"Exclude terms: {len(exclude_terms)} loaded")
    
    try:
        # Parse main PDF using Librán-specific parser
        click.echo("Parsing main PDF...")
        parsed_pages = parse_libran_pdf_pages(str(pdf_path))
        click.echo(f"Parsed {len(parsed_pages)} pages from main PDF")
        
        # Parse support PDF if provided
        if support:
            support_path = Path(support)
            if support_path.exists():
                click.echo("Parsing support PDF...")
                support_pages = parse_pdf_pages(str(support_path))
                parsed_pages.extend(support_pages)
                click.echo(f"Parsed {len(support_pages)} pages from support PDF")
            else:
                click.echo(f"Warning: Support PDF not found: {support}")
        
        # Build dictionaries
        click.echo("Building dictionaries...")
        build_result = build_dictionaries(parsed_pages, output_dir, exclude_terms)

        if dump_csv:
            dump_path = Path(dump_csv)
            dump_path.parent.mkdir(parents=True, exist_ok=True)
            source_csv = output_dir / "ALL_ROWS.csv"
            if source_csv.exists():
                shutil.copy2(source_csv, dump_path)
                click.echo(f"ALL_ROWS.csv copied to: {dump_path}")
            else:
                click.echo(
                    "Warning: ALL_ROWS.csv was not generated; cannot copy to dump location.",
                    err=True,
                )
        
        # Print summary
        click.echo("\nBuild completed successfully!")
        click.echo(f"Ancient entries: {len(build_result.ancient_entries)}")
        click.echo(f"Modern entries: {len(build_result.modern_entries)}")
        click.echo(f"Excluded entries: {len(build_result.excluded_entries)}")
        click.echo(f"Variant entries: {len(build_result.variant_entries)}")
        
        # Show first few entries as sanity check
        click.echo("\nFirst 10 Ancient entries:")
        for i, (english, libran) in enumerate(list(build_result.ancient_entries.items())[:10]):
            click.echo(f"  {english} -> {libran}")
        
        click.echo("\nFirst 10 Modern entries:")
        for i, (english, libran) in enumerate(list(build_result.modern_entries.items())[:10]):
            click.echo(f"  {english} -> {libran}")
        
        click.echo(f"\nOutput files saved to: {output_dir}")
        
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        raise


@cli.command()
@click.option('--ancient', required=True, help='Path to ancient JSON dictionary')
@click.option('--modern', required=True, help='Path to modern JSON dictionary')
@click.option('--out', required=True, help='Output directory for dictionaries')
def import_json(ancient: str, modern: str, out: str):
    """Import dictionaries from JSON files."""
    
    # Validate inputs
    ancient_path = Path(ancient)
    modern_path = Path(modern)
    
    if not ancient_path.exists():
        click.echo(f"Error: Ancient JSON file not found: {ancient}", err=True)
        return
    
    if not modern_path.exists():
        click.echo(f"Error: Modern JSON file not found: {modern}", err=True)
        return
    
    output_dir = Path(out)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    click.echo("Starting JSON dictionary import...")
    click.echo(f"Ancient JSON: {ancient_path}")
    click.echo(f"Modern JSON: {modern_path}")
    click.echo(f"Output: {output_dir}")
    
    try:
        # Import dictionaries
        build_result = import_json_dictionaries(str(ancient_path), str(modern_path), str(output_dir))
        
        # Print summary
        click.echo("\nImport completed successfully!")
        click.echo(f"Ancient entries: {len(build_result.ancient_entries)}")
        click.echo(f"Modern entries: {len(build_result.modern_entries)}")
        
        # Show first few entries as sanity check
        click.echo("\nFirst 10 Ancient entries:")
        for i, (english, libran) in enumerate(list(build_result.ancient_entries.items())[:10]):
            click.echo(f"  {english} -> {libran}")
        
        click.echo("\nFirst 10 Modern entries:")
        for i, (english, libran) in enumerate(list(build_result.modern_entries.items())[:10]):
            click.echo(f"  {english} -> {libran}")
        
        click.echo(f"\nOutput files saved to: {output_dir}")
        
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        raise


@cli.command()
@click.option('--json', required=True, help='Path to Librán dictionary JSON file')
@click.option('--out', required=True, help='Output directory for dictionaries')
def import_libran(json: str, out: str):
    """Import the specialized Librán dictionary JSON format."""
    
    json_path = Path(json)
    if not json_path.exists():
        click.echo(f"Error: JSON file not found: {json}", err=True)
        return
    
    output_dir = Path(out)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    click.echo("Starting Librán dictionary import...")
    click.echo(f"JSON file: {json_path}")
    click.echo(f"Output: {output_dir}")
    
    try:
        # Import the dictionary
        build_result = import_libran_dictionary(str(json_path), str(output_dir))
        
        # Print summary
        click.echo("\nImport completed successfully!")
        click.echo(f"Ancient entries: {build_result.build_stats['total_ancient']}")
        click.echo(f"Modern entries: {build_result.build_stats['total_modern']}")
        click.echo(f"Excluded entries: {build_result.build_stats['excluded']}")
        click.echo(f"Clusters processed: {build_result.build_stats['clusters_processed']}")
        
        # Show first few entries as sanity check
        click.echo("\nFirst 10 Ancient entries:")
        for i, (english, libran) in enumerate(list(build_result.ancient_entries.items())[:10]):
            click.echo(f"  {english} -> {libran}")
        
        click.echo("\nFirst 10 Modern entries:")
        for i, (english, libran) in enumerate(list(build_result.modern_entries.items())[:10]):
            click.echo(f"  {english} -> {libran}")
        
        click.echo(f"\nOutput files saved to: {output_dir}")
        
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        raise


@cli.command()
@click.option('--format', type=click.Choice(['simple', 'detailed', 'nested']), default='simple', help='JSON format type')
@click.option('--output', required=True, help='Output file path')
def create_sample(format: str, output: str):
    """Create a sample JSON dictionary file."""
    
    try:
        create_sample_json_dictionary(output, format)
        click.echo(f"Sample {format} JSON dictionary created: {output}")
        
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        raise


@cli.command()
@click.option('--pdf', required=True, help='Path to PDF file')
@click.option('--page', type=int, help='Specific page number to test')
def test(pdf: str, page: Optional[int] = None):
    """Test PDF parsing on a single page."""
    
    pdf_path = Path(pdf)
    if not pdf_path.exists():
        click.echo(f"Error: PDF file not found: {pdf}", err=True)
        return
    
    try:
        if page:
            # Test specific page
            from .pdf_extract import extract_page_with_metadata
            text, metadata = extract_page_with_metadata(str(pdf_path), page)
            click.echo(f"Page {page} extracted:")
            click.echo(f"Text length: {len(text)}")
            click.echo(f"Lines: {len(text.split(chr(10)))}")
            click.echo("\nFirst 500 characters:")
            click.echo(text[:500])
        else:
            # Test first few pages
            from .pdf_extract import extract_pages
            click.echo("Testing first 3 pages...")
            for page_num, text in extract_pages(str(pdf_path)):
                if page_num > 3:
                    break
                click.echo(f"\nPage {page_num}:")
                click.echo(f"Text length: {len(text)}")
                click.echo(f"Lines: {len(text.split(chr(10)))}")
                click.echo("First 200 characters:")
                click.echo(text[:200])
    
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        raise


def main():
    """Main entry point."""
    cli()


if __name__ == '__main__':
    main()

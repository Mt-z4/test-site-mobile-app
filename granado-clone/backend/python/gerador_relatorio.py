#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import os
from datetime import datetime, timedelta
import pandas as pd
from fpdf import FPDF
import matplotlib.pyplot as plt
import seaborn as sns
from collections import defaultdict

class RelatorioVendas:
    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data')
        self.orders_file = os.path.join(self.data_dir, 'orders.json')
        self.products_file = os.path.join(self.data_dir, 'produtos.json')
        self.report_dir = os.path.join(self.data_dir, 'reports')
        
        # Create reports directory if it doesn't exist
        if not os.path.exists(self.report_dir):
            os.makedirs(self.report_dir)

        # Set style for plots
        plt.style.use('seaborn')
        sns.set_palette("husl")

    def load_data(self):
        """Load data from JSON files"""
        try:
            with open(self.orders_file, 'r', encoding='utf-8') as f:
                self.orders = json.load(f)
            with open(self.products_file, 'r', encoding='utf-8') as f:
                self.products = json.load(f)
            return True
        except FileNotFoundError as e:
            print(f"Error: Could not find data file - {e}")
            return False
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON format - {e}")
            return False

    def prepare_data(self, start_date=None, end_date=None):
        """Prepare data for analysis"""
        if not hasattr(self, 'orders'):
            if not self.load_data():
                return None

        # Convert dates
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d')

        # Create DataFrames
        orders_data = []
        for order in self.orders:
            order_date = datetime.strptime(order['timestamp'].split()[0], '%Y-%m-%d')
            
            if start_date and order_date < start_date:
                continue
            if end_date and order_date > end_date:
                continue

            for item in order['items']:
                orders_data.append({
                    'date': order_date,
                    'order_id': order['order_id'],
                    'product': item['name'],
                    'quantity': item['quantity'],
                    'price': float(item['price']),
                    'total': float(item['price']) * item['quantity']
                })

        return pd.DataFrame(orders_data)

    def generate_sales_charts(self, df):
        """Generate various sales charts"""
        figures_dir = os.path.join(self.report_dir, 'figures')
        if not os.path.exists(figures_dir):
            os.makedirs(figures_dir)

        # Daily Sales Trend
        plt.figure(figsize=(12, 6))
        daily_sales = df.groupby('date')['total'].sum()
        daily_sales.plot(kind='line', marker='o')
        plt.title('Tendência de Vendas Diárias')
        plt.xlabel('Data')
        plt.ylabel('Vendas Totais (R$)')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(os.path.join(figures_dir, 'tendencia_vendas.png'))
        plt.close()

        # Top Products by Revenue
        plt.figure(figsize=(10, 6))
        product_revenue = df.groupby('product')['total'].sum().sort_values(ascending=True)
        product_revenue.plot(kind='barh')
        plt.title('Produtos por Receita')
        plt.xlabel('Receita Total (R$)')
        plt.tight_layout()
        plt.savefig(os.path.join(figures_dir, 'produtos_receita.png'))
        plt.close()

        # Product Sales Distribution
        plt.figure(figsize=(10, 6))
        product_quantity = df.groupby('product')['quantity'].sum().sort_values(ascending=True)
        product_quantity.plot(kind='barh')
        plt.title('Distribuição de Vendas por Produto')
        plt.xlabel('Quantidade Vendida')
        plt.tight_layout()
        plt.savefig(os.path.join(figures_dir, 'distribuicao_vendas.png'))
        plt.close()

        return [
            'tendencia_vendas.png',
            'produtos_receita.png',
            'distribuicao_vendas.png'
        ]

    def generate_pdf_report(self, df, start_date, end_date, charts):
        """Generate PDF report"""
        class PDF(FPDF):
            def header(self):
                self.set_font('Arial', 'B', 15)
                self.cell(0, 10, 'Relatório de Vendas - Granado', 0, 1, 'C')
                self.ln(10)

            def footer(self):
                self.set_y(-15)
                self.set_font('Arial', 'I', 8)
                self.cell(0, 10, f'Página {self.page_no()}', 0, 0, 'C')

        # Create PDF object
        pdf = PDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)

        # Add report period
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(0, 10, f'Período: {start_date} a {end_date}', 0, 1)
        pdf.ln(10)

        # Summary Statistics
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, 'Resumo', 0, 1)
        pdf.set_font('Arial', '', 12)
        
        total_sales = df['total'].sum()
        total_orders = df['order_id'].nunique()
        total_products = df['quantity'].sum()
        avg_order_value = total_sales / total_orders

        summary_data = [
            ['Total de Vendas:', f'R$ {total_sales:,.2f}'],
            ['Número de Pedidos:', f'{total_orders:,}'],
            ['Produtos Vendidos:', f'{total_products:,}'],
            ['Ticket Médio:', f'R$ {avg_order_value:,.2f}']
        ]

        for item in summary_data:
            pdf.cell(80, 10, item[0], 0, 0)
            pdf.cell(0, 10, item[1], 0, 1)

        pdf.ln(10)

        # Add charts
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, 'Análise Gráfica', 0, 1)
        
        for chart in charts:
            pdf.image(os.path.join(self.report_dir, 'figures', chart), 
                     x=10, w=190)
            pdf.ln(5)

        # Top Products Table
        pdf.add_page()
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, 'Produtos Mais Vendidos', 0, 1)
        
        top_products = df.groupby('product').agg({
            'quantity': 'sum',
            'total': 'sum'
        }).sort_values('total', ascending=False).head(10)

        # Table headers
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(80, 10, 'Produto', 1)
        pdf.cell(40, 10, 'Quantidade', 1)
        pdf.cell(40, 10, 'Receita (R$)', 1)
        pdf.ln()

        # Table content
        pdf.set_font('Arial', '', 12)
        for idx, row in top_products.iterrows():
            pdf.cell(80, 10, idx[:30], 1)
            pdf.cell(40, 10, f"{row['quantity']:,}", 1)
            pdf.cell(40, 10, f"{row['total']:,.2f}", 1)
            pdf.ln()

        # Save PDF
        report_file = os.path.join(
            self.report_dir,
            f'relatorio_vendas_{datetime.now().strftime("%Y%m%d")}.pdf'
        )
        pdf.output(report_file)
        return report_file

    def generate_report(self, start_date=None, end_date=None):
        """Generate complete sales report"""
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')

        print(f"Generating report for period: {start_date} to {end_date}")

        # Prepare data
        df = self.prepare_data(start_date, end_date)
        if df is None or df.empty:
            print("Error: No data available for the specified period")
            return None

        # Generate charts
        print("Generating charts...")
        charts = self.generate_sales_charts(df)

        # Generate PDF report
        print("Generating PDF report...")
        report_file = self.generate_pdf_report(df, start_date, end_date, charts)

        print(f"Report generated successfully: {report_file}")
        return report_file

def main():
    """Main function to generate reports"""
    generator = RelatorioVendas()
    
    # Generate report for last 30 days
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    generator.generate_report(
        start_date.strftime('%Y-%m-%d'),
        end_date.strftime('%Y-%m-%d')
    )

if __name__ == "__main__":
    main()

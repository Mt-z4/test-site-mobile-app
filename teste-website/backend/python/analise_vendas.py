#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import os
from datetime import datetime, timedelta
import pandas as pd
import matplotlib.pyplot as plt
from collections import defaultdict

class VendasAnalytics:
    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data')
        self.orders_file = os.path.join(self.data_dir, 'orders.json')
        self.products_file = os.path.join(self.data_dir, 'produtos.json')
        self.report_dir = os.path.join(self.data_dir, 'reports')
        
        # Create reports directory if it doesn't exist
        if not os.path.exists(self.report_dir):
            os.makedirs(self.report_dir)

    def load_data(self):
        """Load orders and products data from JSON files"""
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

    def analyze_sales_by_period(self, start_date=None, end_date=None):
        """Analyze sales within a specific period"""
        if not hasattr(self, 'orders'):
            if not self.load_data():
                return None

        # Convert dates if provided
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d')

        # Filter orders by date range
        filtered_orders = []
        for order in self.orders:
            order_date = datetime.strptime(order['timestamp'].split()[0], '%Y-%m-%d')
            if start_date and order_date < start_date:
                continue
            if end_date and order_date > end_date:
                continue
            filtered_orders.append(order)

        # Calculate total sales and revenue
        total_sales = len(filtered_orders)
        total_revenue = sum(float(order['total']) for order in filtered_orders)

        # Analyze sales by product
        product_sales = defaultdict(int)
        product_revenue = defaultdict(float)
        
        for order in filtered_orders:
            for item in order['items']:
                product_sales[item['name']] += item['quantity']
                product_revenue[item['name']] += float(item['price']) * item['quantity']

        return {
            'total_sales': total_sales,
            'total_revenue': total_revenue,
            'product_sales': dict(product_sales),
            'product_revenue': dict(product_revenue)
        }

    def generate_sales_charts(self, analysis_data):
        """Generate charts for sales analysis"""
        # Create figures directory
        figures_dir = os.path.join(self.report_dir, 'figures')
        if not os.path.exists(figures_dir):
            os.makedirs(figures_dir)

        # Product Sales Chart
        plt.figure(figsize=(12, 6))
        products = list(analysis_data['product_sales'].keys())
        sales = list(analysis_data['product_sales'].values())
        
        plt.bar(products, sales)
        plt.xticks(rotation=45, ha='right')
        plt.title('Vendas por Produto')
        plt.xlabel('Produtos')
        plt.ylabel('Quantidade Vendida')
        plt.tight_layout()
        plt.savefig(os.path.join(figures_dir, 'vendas_por_produto.png'))
        plt.close()

        # Product Revenue Chart
        plt.figure(figsize=(12, 6))
        revenues = list(analysis_data['product_revenue'].values())
        
        plt.bar(products, revenues)
        plt.xticks(rotation=45, ha='right')
        plt.title('Receita por Produto')
        plt.xlabel('Produtos')
        plt.ylabel('Receita (R$)')
        plt.tight_layout()
        plt.savefig(os.path.join(figures_dir, 'receita_por_produto.png'))
        plt.close()

    def analyze_daily_trends(self):
        """Analyze daily sales trends"""
        if not hasattr(self, 'orders'):
            if not self.load_data():
                return None

        daily_sales = defaultdict(float)
        daily_orders = defaultdict(int)

        for order in self.orders:
            date = order['timestamp'].split()[0]
            daily_sales[date] += float(order['total'])
            daily_orders[date] += 1

        return {
            'daily_sales': dict(daily_sales),
            'daily_orders': dict(daily_orders)
        }

    def generate_report(self, period='last_month'):
        """Generate a comprehensive sales report"""
        # Set date range based on period
        end_date = datetime.now()
        if period == 'last_month':
            start_date = end_date - timedelta(days=30)
        elif period == 'last_week':
            start_date = end_date - timedelta(days=7)
        else:
            start_date = end_date - timedelta(days=365)

        # Get analysis data
        analysis_data = self.analyze_sales_by_period(
            start_date.strftime('%Y-%m-%d'),
            end_date.strftime('%Y-%m-%d')
        )

        if not analysis_data:
            print("Error: Could not generate report - No data available")
            return

        # Generate charts
        self.generate_sales_charts(analysis_data)

        # Get daily trends
        trends_data = self.analyze_daily_trends()

        # Create report
        report = f"""
RELATÓRIO DE VENDAS - {start_date.strftime('%d/%m/%Y')} a {end_date.strftime('%d/%m/%Y')}
{'='*80}

RESUMO GERAL
-----------
Total de Vendas: {analysis_data['total_sales']}
Receita Total: R$ {analysis_data['total_revenue']:.2f}

PRODUTOS MAIS VENDIDOS
--------------------
"""
        # Sort products by sales
        sorted_products = sorted(
            analysis_data['product_sales'].items(),
            key=lambda x: x[1],
            reverse=True
        )

        for product, sales in sorted_products[:5]:
            revenue = analysis_data['product_revenue'][product]
            report += f"{product}: {sales} unidades (R$ {revenue:.2f})\n"

        report += "\nTENDÊNCIAS DIÁRIAS\n-----------------\n"
        
        # Add daily trends if available
        if trends_data:
            sorted_days = sorted(trends_data['daily_sales'].keys())
            for day in sorted_days[-5:]:  # Last 5 days
                sales = trends_data['daily_sales'][day]
                orders = trends_data['daily_orders'][day]
                report += f"{day}: {orders} pedidos (R$ {sales:.2f})\n"

        # Save report
        report_file = os.path.join(
            self.report_dir,
            f'relatorio_vendas_{end_date.strftime("%Y%m%d")}.txt'
        )
        
        try:
            with open(report_file, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"Report generated successfully: {report_file}")
        except Exception as e:
            print(f"Error saving report: {e}")

def main():
    """Main function to run the analysis"""
    analytics = VendasAnalytics()
    
    # Generate reports for different periods
    for period in ['last_week', 'last_month']:
        print(f"\nGenerating report for {period}...")
        analytics.generate_report(period)

if __name__ == "__main__":
    main()

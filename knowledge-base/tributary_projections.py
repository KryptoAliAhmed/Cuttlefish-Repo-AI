"""
Tributary AI Campus Financial Model
Comprehensive ROI analysis for Golden NFT investors
"""

import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
import streamlit as st

class TributaryFinancialModel:
    """Financial modeling for Tributary AI Campus investment"""
    
    def __init__(self):
        # Base assumptions
        self.facility_sqft = 420460
        self.acquisition_cost = 2500000  # $2.5M for the facility
        self.renovation_cost = 7500000   # $7.5M for AI/energy retrofitting
        self.total_nfts = 21000
        self.golden_tier_nfts = 1000
        self.target_raise = 10000000     # $10M target
        
        # Revenue streams
        self.revenue_streams = {
            "real_estate_rental": 0.15,      # 15% annual yield on property value
            "ai_compute_licensing": 0.25,    # 25% annual yield on AI infrastructure
            "carbon_credits": 0.08,          # 8% annual yield
            "education_programs": 0.12,      # 12% annual yield
            "ip_licensing": 0.20,            # 20% annual yield on IP
            "event_hosting": 0.10            # 10% annual yield
        }
        
        # Operating expenses (% of revenue)
        self.operating_expenses = 0.35
        
    def calculate_property_value_appreciation(self, years=10):
        """Calculate property value appreciation over time"""
        base_value = self.acquisition_cost + self.renovation_cost
        appreciation_rate = 0.06  # 6% annual appreciation
        
        values = []
        for year in range(years + 1):
            value = base_value * (1 + appreciation_rate) ** year
            values.append(value)
        
        return values
    
    def calculate_revenue_projections(self, years=10):
        """Calculate revenue projections by stream"""
        property_values = self.calculate_property_value_appreciation(years)
        
        projections = {}
        total_revenue = []
        
        for year in range(years + 1):
            year_revenue = {}
            property_value = property_values[year]
            
            # Real estate rental (based on property value)
            year_revenue["real_estate_rental"] = property_value * self.revenue_streams["real_estate_rental"]
            
            # AI compute licensing (scales with adoption)
            ai_base = 1000000  # $1M base in year 1
            growth_factor = 1.3 ** year  # 30% annual growth
            year_revenue["ai_compute_licensing"] = ai_base * growth_factor
            
            # Carbon credits (based on solar/geothermal capacity)
            carbon_base = 200000  # $200K base
            year_revenue["carbon_credits"] = carbon_base * (1.15 ** year)  # 15% growth
            
            # Education programs
            education_base = 300000  # $300K base
            year_revenue["education_programs"] = education_base * (1.20 ** year)  # 20% growth
            
            # IP licensing (grows with research output)
            ip_base = 150000  # $150K base
            year_revenue["ip_licensing"] = ip_base * (1.25 ** year)  # 25% growth
            
            # Event hosting
            event_base = 100000  # $100K base
            year_revenue["event_hosting"] = event_base * (1.10 ** year)  # 10% growth
            
            projections[year] = year_revenue
            total_revenue.append(sum(year_revenue.values()))
        
        return projections, total_revenue
    
    def calculate_nft_returns(self, years=10):
        """Calculate returns for NFT holders"""
        _, total_revenue = self.calculate_revenue_projections(years)
        
        nft_returns = []
        for year in range(years + 1):
            gross_revenue = total_revenue[year]
            net_revenue = gross_revenue * (1 - self.operating_expenses)
            
            # 70% of net revenue distributed to NFT holders
            distribution_pool = net_revenue * 0.70
            
            # Per NFT return
            per_nft_return = distribution_pool / self.total_nfts
            nft_returns.append(per_nft_return)
        
        return nft_returns
    
    def calculate_roi_metrics(self, years=10):
        """Calculate key ROI metrics"""
        nft_price = self.target_raise / self.total_nfts  # ~$476 per NFT
        nft_returns = self.calculate_nft_returns(years)
        
        # Calculate cumulative returns
        cumulative_returns = np.cumsum(nft_returns)
        
        # Calculate ROI percentages
        roi_percentages = [(cum_return / nft_price) * 100 for cum_return in cumulative_returns]
        
        # Calculate payback period
        payback_period = None
        for i, cum_return in enumerate(cumulative_returns):
            if cum_return >= nft_price:
                payback_period = i
                break
        
        # Calculate IRR (simplified)
        cash_flows = [-nft_price] + nft_returns[1:]  # Initial investment + annual returns
        irr = np.irr(cash_flows) if len(cash_flows) > 1 else 0
        
        return {
            "nft_price": nft_price,
            "annual_returns": nft_returns,
            "cumulative_returns": cumulative_returns,
            "roi_percentages": roi_percentages,
            "payback_period": payback_period,
            "irr": irr,
            "10_year_total_return": roi_percentages[10] if len(roi_percentages) > 10 else roi_percentages[-1]
        }

def create_financial_dashboard():
    """Create Streamlit dashboard for financial projections"""
    st.set_page_config(page_title="Tributary AI Campus - Financial Model", layout="wide")
    
    st.title("🐙 Tributary AI Campus Financial Projections")
    st.markdown("**Comprehensive ROI analysis for Golden NFT investors**")
    
    model = TributaryFinancialModel()
    
    # Sidebar controls
    st.sidebar.header("Model Parameters")
    years = st.sidebar.slider("Projection Years", 5, 15, 10)
    target_raise = st.sidebar.number_input("Target Raise ($M)", 5, 20, 10) * 1000000
    model.target_raise = target_raise
    
    # Calculate projections
    revenue_projections, total_revenue = model.calculate_revenue_projections(years)
    roi_metrics = model.calculate_roi_metrics(years)
    property_values = model.calculate_property_value_appreciation(years)
    
    # Key metrics row
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("NFT Price", f"${roi_metrics['nft_price']:,.0f}")
    
    with col2:
        st.metric("10-Year ROI", f"{roi_metrics['10_year_total_return']:.1f}%")
    
    with col3:
        payback = roi_metrics['payback_period']
        st.metric("Payback Period", f"{payback} years" if payback else "N/A")
    
    with col4:
        st.metric("Year 5 Revenue", f"${total_revenue[5]:,.0f}")
    
    # Revenue breakdown chart
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Revenue Projections by Stream")
        
        # Prepare data for stacked area chart
        years_list = list(range(years + 1))
        revenue_df = pd.DataFrame()
        
        for stream in model.revenue_streams.keys():
            revenue_df[stream.replace('_', ' ').title()] = [
                revenue_projections[year][stream] for year in years_list
            ]
        revenue_df['Year'] = years_list
        
        fig = px.area(revenue_df, x='Year', y=revenue_df.columns[:-1],
                     title="Revenue Streams Over Time")
        fig.update_layout(height=400)
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        st.subheader("NFT Holder Returns")
        
        returns_df = pd.DataFrame({
            'Year': years_list,
            'Annual Return': roi_metrics['annual_returns'],
            'Cumulative Return': roi_metrics['cumulative_returns'],
            'ROI %': roi_metrics['roi_percentages']
        })
        
        fig = make_subplots(specs=[[{"secondary_y": True}]])
        
        fig.add_trace(
            go.Bar(x=returns_df['Year'], y=returns_df['Annual Return'], 
                   name="Annual Return", opacity=0.7),
            secondary_y=False,
        )
        
        fig.add_trace(
            go.Scatter(x=returns_df['Year'], y=returns_df['ROI %'], 
                      name="Cumulative ROI %", line=dict(color="red", width=3)),
            secondary_y=True,
        )
        
        fig.update_xaxes(title_text="Year")
        fig.update_yaxes(title_text="Annual Return ($)", secondary_y=False)
        fig.update_yaxes(title_text="ROI %", secondary_y=True)
        fig.update_layout(title="NFT Returns Analysis", height=400)
        
        st.plotly_chart(fig, use_container_width=True)
    
    # Property value appreciation
    st.subheader("Property Value Appreciation")
    
    property_df = pd.DataFrame({
        'Year': years_list,
        'Property Value': property_values,
        'Appreciation': [(val - property_values[0]) / property_values[0] * 100 
                        for val in property_values]
    })
    
    col1, col2 = st.columns(2)
    
    with col1:
        fig = px.line(property_df, x='Year', y='Property Value',
                     title="Property Value Over Time")
        fig.update_layout(height=300)
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        fig = px.bar(property_df, x='Year', y='Appreciation',
                    title="Property Appreciation %")
        fig.update_layout(height=300)
        st.plotly_chart(fig, use_container_width=True)
    
    # Detailed projections table
    st.subheader("Detailed Financial Projections")
    
    detailed_df = pd.DataFrame()
    for year in years_list:
        row = {
            'Year': year,
            'Total Revenue': total_revenue[year],
            'Operating Expenses': total_revenue[year] * model.operating_expenses,
            'Net Revenue': total_revenue[year] * (1 - model.operating_expenses),
            'NFT Distribution': total_revenue[year] * (1 - model.operating_expenses) * 0.70,
            'Per NFT Return': roi_metrics['annual_returns'][year],
            'Cumulative ROI %': roi_metrics['roi_percentages'][year]
        }
        detailed_df = pd.concat([detailed_df, pd.DataFrame([row])], ignore_index=True)
    
    # Format currency columns
    currency_cols = ['Total Revenue', 'Operating Expenses', 'Net Revenue', 'NFT Distribution', 'Per NFT Return']
    for col in currency_cols:
        detailed_df[col] = detailed_df[col].apply(lambda x: f"${x:,.0f}")
    
    detailed_df['Cumulative ROI %'] = detailed_df['Cumulative ROI %'].apply(lambda x: f"{x:.1f}%")
    
    st.dataframe(detailed_df, use_container_width=True)
    
    # Risk analysis
    st.subheader("Risk Analysis & Sensitivity")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        **Key Risks:**
        - Market adoption of AI compute services
        - Regulatory changes in NFT/crypto space
        - Property market fluctuations
        - Technology obsolescence
        - Competition from established players
        """)
    
    with col2:
        st.markdown("""
        **Mitigation Strategies:**
        - Diversified revenue streams
        - Strong regulatory compliance
        - Flexible, modular infrastructure
        - Strategic partnerships
        - Conservative financial projections
        """)

if __name__ == "__main__":
    create_financial_dashboard()

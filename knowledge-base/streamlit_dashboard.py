"""
Cuttlefish DAO ROI & Impact Dashboard
Real-time visualization of proposal scores, grant status, and ROI forecasts
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import requests
import json
from datetime import datetime, timedelta
import numpy as np

# Page configuration
st.set_page_config(
    page_title="Cuttlefish DAO Dashboard",
    page_icon="🐙",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #1f77b4;
    }
    .success-metric {
        border-left-color: #2ca02c;
    }
    .warning-metric {
        border-left-color: #ff7f0e;
    }
    .danger-metric {
        border-left-color: #d62728;
    }
</style>
""", unsafe_allow_html=True)

class DashboardData:
    """Handles data fetching and processing"""
    
    def __init__(self):
        self.api_base = "http://localhost:8000/api"
        self.airtable_api = "https://api.airtable.com/v0"
        
    @st.cache_data(ttl=60)  # Cache for 1 minute
    def fetch_proposal_scores(_self):
        """Fetch proposal scores from scoring agent"""
        try:
            response = requests.get(f"{_self.api_base}/proposals/scores")
            if response.status_code == 200:
                return response.json()["scores"]
            return []
        except Exception as e:
            st.error(f"Failed to fetch proposal scores: {e}")
            return []
    
    def generate_mock_data(self):
        """Generate mock data for demonstration"""
        np.random.seed(42)
        
        proposals = []
        for i in range(50):
            proposal = {
                "proposal_id": f"PROP-{i+1:03d}",
                "title": f"Infrastructure Project {i+1}",
                "overall_score": np.random.normal(75, 15),
                "impact_score": np.random.normal(80, 12),
                "feasibility_score": np.random.normal(70, 18),
                "alignment_score": np.random.normal(85, 10),
                "risk_score": np.random.normal(75, 20),
                "requested_amount": np.random.uniform(50000, 500000),
                "category": np.random.choice(["Infrastructure", "AI", "Green Energy", "Research"]),
                "status": np.random.choice(["Pending", "Approved", "Rejected", "Under Review"]),
                "submission_date": datetime.now() - timedelta(days=np.random.randint(1, 90)),
                "recommendation": np.random.choice(["APPROVE", "CONDITIONAL", "REJECT"])
            }
            proposals.append(proposal)
        
        return proposals

dashboard_data = DashboardData()

def main():
    """Main dashboard function"""
    
    # Header
    st.title("🐙 Cuttlefish DAO Dashboard")
    st.markdown("Real-time proposal scoring, ROI analysis, and impact tracking")
    
    # Sidebar filters
    st.sidebar.header("Filters")
    
    # Fetch data
    proposals = dashboard_data.fetch_proposal_scores()
    if not proposals:
        proposals = dashboard_data.generate_mock_data()
    
    df = pd.DataFrame(proposals)
    
    # Sidebar filters
    categories = st.sidebar.multiselect(
        "Categories",
        options=df["category"].unique(),
        default=df["category"].unique()
    )
    
    status_filter = st.sidebar.multiselect(
        "Status",
        options=df["status"].unique(),
        default=df["status"].unique()
    )
    
    score_range = st.sidebar.slider(
        "Overall Score Range",
        min_value=0.0,
        max_value=100.0,
        value=(0.0, 100.0)
    )
    
    # Filter data
    filtered_df = df[
        (df["category"].isin(categories)) &
        (df["status"].isin(status_filter)) &
        (df["overall_score"] >= score_range[0]) &
        (df["overall_score"] <= score_range[1])
    ]
    
    # Key Metrics Row
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        total_proposals = len(filtered_df)
        st.metric("Total Proposals", total_proposals)
    
    with col2:
        avg_score = filtered_df["overall_score"].mean()
        st.metric("Average Score", f"{avg_score:.1f}")
    
    with col3:
        total_requested = filtered_df["requested_amount"].sum()
        st.metric("Total Requested", f"${total_requested:,.0f}")
    
    with col4:
        approved_count = len(filtered_df[filtered_df["recommendation"] == "APPROVE"])
        approval_rate = (approved_count / len(filtered_df)) * 100 if len(filtered_df) > 0 else 0
        st.metric("Approval Rate", f"{approval_rate:.1f}%")
    
    # Charts Row 1
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Score Distribution")
        fig_hist = px.histogram(
            filtered_df,
            x="overall_score",
            nbins=20,
            title="Overall Score Distribution",
            color_discrete_sequence=["#1f77b4"]
        )
        fig_hist.update_layout(height=400)
        st.plotly_chart(fig_hist, use_container_width=True)
    
    with col2:
        st.subheader("Proposals by Category")
        category_counts = filtered_df["category"].value_counts()
        fig_pie = px.pie(
            values=category_counts.values,
            names=category_counts.index,
            title="Proposal Distribution by Category"
        )
        fig_pie.update_layout(height=400)
        st.plotly_chart(fig_pie, use_container_width=True)
    
    # Charts Row 2
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Score Components Analysis")
        score_components = filtered_df[["impact_score", "feasibility_score", "alignment_score", "risk_score"]].mean()
        
        fig_radar = go.Figure()
        fig_radar.add_trace(go.Scatterpolar(
            r=score_components.values,
            theta=["Impact", "Feasibility", "Alignment", "Risk"],
            fill='toself',
            name='Average Scores'
        ))
        fig_radar.update_layout(
            polar=dict(
                radialaxis=dict(
                    visible=True,
                    range=[0, 100]
                )),
            showlegend=True,
            height=400,
            title="Average Score Components"
        )
        st.plotly_chart(fig_radar, use_container_width=True)
    
    with col2:
        st.subheader("ROI Forecast")
        # Mock ROI calculation
        filtered_df["estimated_roi"] = (filtered_df["overall_score"] / 100) * np.random.uniform(0.8, 1.5, len(filtered_df))
        
        fig_scatter = px.scatter(
            filtered_df,
            x="requested_amount",
            y="estimated_roi",
            size="overall_score",
            color="category",
            title="ROI vs Investment Amount",
            hover_data=["proposal_id", "overall_score"]
        )
        fig_scatter.update_layout(height=400)
        st.plotly_chart(fig_scatter, use_container_width=True)
    
    # Detailed Table
    st.subheader("Proposal Details")
    
    # Format the dataframe for display
    display_df = filtered_df.copy()
    display_df["overall_score"] = display_df["overall_score"].round(1)
    display_df["requested_amount"] = display_df["requested_amount"].apply(lambda x: f"${x:,.0f}")
    display_df["submission_date"] = pd.to_datetime(display_df["submission_date"]).dt.strftime("%Y-%m-%d")
    
    # Select columns to display
    columns_to_show = [
        "proposal_id", "title", "category", "overall_score", 
        "requested_amount", "recommendation", "status", "submission_date"
    ]
    
    st.dataframe(
        display_df[columns_to_show],
        use_container_width=True,
        height=400
    )
    
    # Real-time Updates Section
    st.subheader("Real-time Monitoring")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric(
            "Active Connections",
            "12",  # This would come from the WebSocket endpoint
            delta="2"
        )
    
    with col2:
        st.metric(
            "Proposals Today",
            len(filtered_df[pd.to_datetime(filtered_df["submission_date"]).dt.date == datetime.now().date()]),
            delta="3"
        )
    
    with col3:
        st.metric(
            "System Health",
            "Healthy",
            delta="100%"
        )
    
    # Auto-refresh
    if st.sidebar.button("Refresh Data"):
        st.cache_data.clear()
        st.experimental_rerun()
    
    # Auto-refresh every 30 seconds
    st.sidebar.markdown("---")
    auto_refresh = st.sidebar.checkbox("Auto-refresh (30s)")
    if auto_refresh:
        import time
        time.sleep(30)
        st.experimental_rerun()

if __name__ == "__main__":
    main()

# base_agent.py
import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

class BaseAgent:
    def __init__(self, role, api_key=None):
        self.role = role
        self.llm = ChatOpenAI(model="gpt-4o-mini", api_key=os.getenv("OPENAI_API_KEY") or api_key)
        self.prompt = ChatPromptTemplate.from_template("You are a {role} agent. Task: {task}. Respond concisely.")

    def execute(self, task, context=""):
        chain = self.prompt | self.llm | StrOutputParser()
        return chain.invoke({"role": self.role, "task": f"{task} with context: {context}"})


# predictive_agent.py
from base_agent import BaseAgent

class PredictiveAgent(BaseAgent):
    def __init__(self):
        super().__init__("Predictive")

    def forecast(self, data):
        task = f"Forecast market trends based on data: {data}."
        return self.execute(task)


# risk_agent.py
from base_agent import BaseAgent

class RiskAgent(BaseAgent):
    def __init__(self):
        super().__init__("Risk")

    def assess(self, strategy):
        task = f"Assess risks in strategy: {strategy}. Suggest mitigations."
        return self.execute(task)


# planner_agent.py
from base_agent import BaseAgent
from langchain.memory import ConversationBufferMemory

class PlannerAgent(BaseAgent):
    def __init__(self):
        super().__init__("Planner")
        self.memory = ConversationBufferMemory()

    def plan(self, goal):
        context = self.memory.load_memory_variables({})["history"]
        task = f"Plan steps to achieve: {goal}."
        response = self.execute(task, context)
        self.memory.save_context({"input": goal}, {"output": response})
        return response


# architect_agent.py
from base_agent import BaseAgent
from predictive_agent import PredictiveAgent
from risk_agent import RiskAgent
from planner_agent import PlannerAgent

class ArchitectAgent(BaseAgent):
    def __init__(self):
        super().__init__("Architect")
        self.predictive = PredictiveAgent()
        self.risk = RiskAgent()
        self.planner = PlannerAgent()

    def orchestrate(self, objective):
        forecast = self.predictive.forecast("crypto market data")  # Integrate real API
        risks = self.risk.assess(forecast)
        plan = self.planner.plan(f"{objective} considering {forecast} and {risks}")
        return {"forecast": forecast, "risks": risks, "plan": plan}


# example_usage.py
from architect_agent import ArchitectAgent

architect = ArchitectAgent()
result = architect.orchestrate("Optimize liquidity pool yield")
print(result)

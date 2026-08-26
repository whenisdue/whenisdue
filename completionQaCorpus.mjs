export const completionQaCorpus = [
  {
    "category": "business-days-complete",
    "query": "5 business days after August 10",
    "expectedKind": "navigate",
    "expectedPathContains": "/business-days-calculator"
  },
  {
    "category": "business-days-complete",
    "query": "8 working days after Sep 3",
    "expectedKind": "navigate",
    "expectedPathContains": "/business-days-calculator"
  },
  {
    "category": "business-days-complete",
    "query": "7 business days from today",
    "expectedKind": "navigate",
    "expectedPathContains": "/business-days-calculator"
  },
  {
    "category": "business-days-missing",
    "query": "business days after August 10",
    "expectedKind": "missing",
    "expectedPromptContains": "How many business days"
  },
  {
    "category": "business-days-missing",
    "query": "5 business days",
    "expectedKind": "missing",
    "expectedPromptContains": "What date should I start from"
  },
  {
    "category": "invoice-complete",
    "query": "invoice August 5 net 30",
    "expectedKind": "navigate",
    "expectedPathContains": "/invoice-due-date-calculator"
  },
  {
    "category": "invoice-complete",
    "query": "invoice aug 5 net45",
    "expectedKind": "navigate",
    "expectedPathContains": "/invoice-due-date-calculator"
  },
  {
    "category": "invoice-complete",
    "query": "Net 60 invoice dated September 2",
    "expectedKind": "navigate",
    "expectedPathContains": "/invoice-due-date-calculator"
  },
  {
    "category": "invoice-complete",
    "query": "inovice Aug 5 net30",
    "expectedKind": "navigate",
    "expectedPathContains": "/invoice-due-date-calculator"
  },
  {
    "category": "invoice-missing",
    "query": "invoice August 5",
    "expectedKind": "missing",
    "expectedPromptContains": "What are the payment terms"
  },
  {
    "category": "invoice-missing",
    "query": "net 30 invoice",
    "expectedKind": "missing",
    "expectedPromptContains": "What is the invoice date"
  },
  {
    "category": "invoice-numeric-date",
    "query": "client invoice dated 8/5 net 45",
    "expectedKind": "missing",
    "expectedPromptContains": "Does 8/5 mean"
  },
  {
    "category": "return-complete",
    "query": "30 day return from August 1",
    "expectedKind": "navigate",
    "expectedPathContains": "/return-window-calculator"
  },
  {
    "category": "return-complete",
    "query": "bought this yesterday 14 day return",
    "expectedKind": "navigate",
    "expectedPathContains": "/return-window-calculator"
  },
  {
    "category": "return-complete",
    "query": "14 day return from today",
    "expectedKind": "navigate",
    "expectedPathContains": "/return-window-calculator"
  },
  {
    "category": "return-missing",
    "query": "30 day return",
    "expectedKind": "missing",
    "expectedPromptContains": "What was the purchase date"
  },
  {
    "category": "return-missing",
    "query": "return from August 1",
    "expectedKind": "missing",
    "expectedPromptContains": "How long is the return window"
  },
  {
    "category": "trial-complete",
    "query": "14 day trial from today",
    "expectedKind": "navigate",
    "expectedPathContains": "/free-trial-calculator"
  },
  {
    "category": "trial-complete",
    "query": "trial started August 5 for 30 days",
    "expectedKind": "navigate",
    "expectedPathContains": "/free-trial-calculator"
  },
  {
    "category": "trial-complete",
    "query": "7 day free trial from tomorrow",
    "expectedKind": "navigate",
    "expectedPathContains": "/free-trial-calculator"
  },
  {
    "category": "trial-missing",
    "query": "free trial ends when",
    "expectedKind": "missing",
    "expectedPromptContains": "How long is the trial"
  },
  {
    "category": "trial-missing",
    "query": "14 day trial",
    "expectedKind": "missing",
    "expectedPromptContains": "When did the trial start"
  },
  {
    "category": "shipping-complete",
    "query": "shipping 3 to 5 working days from Sep 3",
    "expectedKind": "navigate",
    "expectedPathContains": "/shipping-delivery-range-calculator"
  },
  {
    "category": "shipping-complete",
    "query": "3-5 business days shipping from August 10",
    "expectedKind": "navigate",
    "expectedPathContains": "/shipping-delivery-range-calculator"
  },
  {
    "category": "shipping-complete",
    "query": "delivery 5 to 7 business days from today",
    "expectedKind": "navigate",
    "expectedPathContains": "/shipping-delivery-range-calculator"
  },
  {
    "category": "shipping-missing",
    "query": "3-5 business days shipping",
    "expectedKind": "missing",
    "expectedPromptContains": "What date was it shipped"
  },
  {
    "category": "shipping-missing",
    "query": "shipping from August 10",
    "expectedKind": "missing",
    "expectedPromptContains": "What delivery range were you given"
  },
  {
    "category": "suggestion-click",
    "query": "invoice aug 5 net30",
    "expectedKind": "navigate",
    "expectedPathContains": "/invoice-due-date-calculator",
    "suggestion": "invoice due date from Net terms"
  },
  {
    "category": "suggestion-click",
    "query": "30 day return from August 1",
    "expectedKind": "navigate",
    "expectedPathContains": "/return-window-calculator",
    "suggestion": "30 day return window"
  },
  {
    "category": "suggestion-click",
    "query": "shipping 3 to 5 working days from Sep 3",
    "expectedKind": "navigate",
    "expectedPathContains": "/shipping-delivery-range-calculator",
    "suggestion": "delivery date range from a ship date"
  },
  {
    "category": "shipping-complete",
    "query": "shipped yesterday should arrive in 5 business days",
    "expectedKind": "navigate",
    "expectedPathContains": "/shipping-delivery-range-calculator"
  }
,
  {
    "category": "business-days-direction-before",
    "query": "30 business days before December 1",
    "expectedKind": "navigate",
    "expectedPathEquals": "/deadline-calculator?date=2026-12-01&days=30&unit=business-days&direction=before&startday=exclude-trigger&calendar=none"
  },
  {
    "category": "business-days-startday-ambiguity",
    "query": "got this aug 14 says reply within 7 business days when due",
    "expectedKind": "navigate",
    "expectedPathEquals": "/deadline-calculator?date=2026-08-14&days=7&unit=business-days&direction=after&startday=unspecified&calendar=none"
  },
  {
    "category": "business-days-holiday-context",
    "query": "10 business days after Aug 24 excluding US federal holidays",
    "expectedKind": "navigate",
    "expectedPathEquals": "/business-days-calculator?start=2026-08-24&days=10&calendar=us"
  },
  {
    "category": "regression-control",
    "query": "30 business days after December 1",
    "expectedKind": "navigate",
    "expectedPathEquals": "/business-days-calculator?start=2026-12-01&days=30"
  },
  {
    "category": "regression-control",
    "query": "7 business days from today",
    "expectedKind": "navigate",
    "expectedPathEquals": "/business-days-calculator?start=2026-08-26&days=7"
  },
  {
    "category": "regression-control",
    "query": "invoice aug 5 net30?",
    "expectedKind": "navigate",
    "expectedPathEquals": "/invoice-due-date-calculator?date=2026-08-05&term=net30"
  },
  {
    "category": "regression-control",
    "query": "3-5 business days shipping from August 10",
    "expectedKind": "navigate",
    "expectedPathEquals": "/shipping-delivery-range-calculator?start=2026-08-10&min=3&max=5&mode=business"
  }
];

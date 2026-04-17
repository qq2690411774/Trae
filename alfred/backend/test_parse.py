import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pipeline.output_parser import parse_output

raw = "I think this should be confirmed before sending. The user seems unsure."
out, failed = parse_output(raw, "")
with open("parse_test.txt", "w") as f:
    f.write(f"decision={out.decision}\nconfidence={out.confidence}\nintent_resolved={out.intent_resolved}\nfailed={failed}\nrationale={out.rationale}\n")

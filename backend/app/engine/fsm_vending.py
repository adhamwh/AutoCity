class VendingFSM:
    def __init__(self):
        self.state = "IDLE"
        self.credit = 0
    def send(self, event: str):
        if event.startswith("coin_"):
            try: self.credit += int(event.split("_",1)[1])
            except Exception: pass
            self.state = "CREDIT"
        elif event == "select" and self.credit >= 5:
            self.credit -= 5; self.state = "DISPENSE"
        elif event == "done":
            self.state = "IDLE"

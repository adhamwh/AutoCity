class ElevatorFSM:
    def __init__(self):
        self.state = "IDLE"
        self.floor = 0
    def send(self, event: str):
        if event == "call_up" and self.state in {"IDLE","DOORS_OPEN"}:
            self.state = "MOVING_UP"; self.floor += 1
        elif event == "call_down" and self.state in {"IDLE","DOORS_OPEN"} and self.floor > 0:
            self.state = "MOVING_DOWN"; self.floor -= 1
        elif event == "arrive":
            self.state = "DOORS_OPEN"
        elif event == "close":
            self.state = "IDLE"

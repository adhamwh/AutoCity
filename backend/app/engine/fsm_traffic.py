class TrafficLightFSM:
    def __init__(self):
        self.state = "RED"
    def send(self, event: str):
        if event == "timer":
            self.state = {"RED":"GREEN","GREEN":"YELLOW","YELLOW":"RED"}[self.state]

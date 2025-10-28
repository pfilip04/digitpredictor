import torch
import torchvision.transforms as transforms

from .nn import NeuralNetwork
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "brojke_nn.pth")

model = None


def load_model():
    global model
    if model is None:
        model = NeuralNetwork()
        model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device("cpu")))
        model.eval()
    return model

t = transforms.Compose([
    transforms.Grayscale(1),
    transforms.ToTensor(),
    transforms.Normalize((0.5, ), (0.5, ))
])

def predict_image(pil_image):
    model1 = load_model()

    img_tensor = t(pil_image).unsqueeze(0)

    with torch.no_grad():

        output = model1(img_tensor)
        probs = torch.softmax(output, dim=1)

        bprobs, bnums = torch.topk(probs, 3, dim=1)

        bprobs = bprobs.squeeze(0).tolist()
        bnums = bnums.squeeze(0).tolist()

        bprobs = [p * 100 for p in bprobs]

        predicted = bnums[0]
        confidence = bprobs[0]

        contenders = list(zip(bnums[1:], bprobs[1:]))

        return{
        "predicted": predicted,
        "confidence": round(confidence, 2),
        "contenders": [{"digit": d, "confidence": round(c, 2)} for d, c in contenders]
    }


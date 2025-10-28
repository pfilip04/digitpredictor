import base64
from io import BytesIO
from django.http import JsonResponse
from PIL import Image
from .ml_model.predictor import predict_image
from django.shortcuts import render

def start(request):
    return render(request, 'start.html')
def home(request):
    return render(request, 'home.html')
def neuralnet(request):
    return render(request, 'neuralnet.html')
def about(request):
    return render(request, 'about.html')
def contact(request):
    return render(request, 'contact.html')
def fakepaint(request):
    return render(request, 'predictor/fakepaint.html')
def predictnumber(request):
    if request.method == "POST":
        import json
        try:
            data = json.loads(request.body)
            img_data = data['image']

            img_data = img_data.split(',')[1]

            image_bytes = base64.b64decode(img_data)

            image = Image.open(BytesIO(image_bytes))

            image = image.convert('RGB')

            result = predict_image(image)

            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({"error": str(e)})

    return JsonResponse({"error": "Invalid request"})


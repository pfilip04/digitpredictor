from django.urls import path
from .views import start, home, neuralnet, about, contact, fakepaint, predictnumber

urlpatterns = [
    path('', start, name='start'),
    path('home/', home, name='home'),
    path('neuralnetworks/', neuralnet, name='neuralnet'),
    path('about/', about, name='about'),
    path('contact/', contact, name='contact'),
    path('predictor/', fakepaint, name='fakepaint'),
    path('predict/', predictnumber, name='predictnumber')
]


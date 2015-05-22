# coding: utf-8

from django.conf.urls import include, url


urlpatterns = [
    url(r'', include('yatable.urls', namespace='api'))
]
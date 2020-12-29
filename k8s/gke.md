## GKE, Google Kubernetes Engine

    # List of predefined machines
    gcloud compute machine-types list | grep europe-west3-a
    
    # Create cluster
    gcloud container clusters create anki-vocabulary --num-nodes=3 --machine-type=e2-small
    gcloud container clusters create anki-vocabulary --num-nodes=2 --machine-type=custom-2-2048
    
    # Ssh connect (`kubectl get nodes` to get node name)
    gcloud beta compute ssh --zone "europe-west3-a" "gke-anki-vocabulary-default-pool-fd007ad3-9lc5" --project "anki-vocabulary-bot"
    
    # Delete cluster
    gcloud container clusters delete anki-vocabulary
    
### GCR, Google Container Registry

    gcloud auth configure-docker
    
    docker tag ankid-369837507:latest gcr.io/anki-vocabulary-bot/ankid-369837507:latest
    docker push gcr.io/anki-vocabulary-bot/ankid-369837507:latest
    
    docker tag ankid-339253577:latest gcr.io/anki-vocabulary-bot/ankid-339253577:latest
    docker push gcr.io/anki-vocabulary-bot/ankid-339253577:latest
    
    docker tag anki-builder:latest gcr.io/anki-vocabulary-bot/anki-builder:latest
    docker push gcr.io/anki-vocabulary-bot/anki-builder:latest
    
### Kubectl

    kubectl apply -f secret.yml -f deployment.yml
    kubectl delete -f secret.yml -f deployment.yml
    

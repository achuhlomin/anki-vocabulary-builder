## GKE, Google Kubernetes Engine

    # List of predefined machines
    gcloud compute machine-types list | grep europe-west3-a
    
    # Create cluster
    gcloud container clusters create anki-vocabulary --num-nodes=1 --machine-type=custom-4-2048
    
    # Ssh connect
    gcloud beta compute ssh --zone "europe-west3-a" "gke-anki-vocabulary-default-pool-fd007ad3-9lc5" --project "anki-vocabulary-bot"
    
    # Delete cluster
    gcloud container clusters delete anki-vocabulary

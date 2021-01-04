## Minikube

https://minikube.sigs.k8s.io/docs/handbook/pushing/  

### Usage

    minikube start -p anki-cluster
    minikube stop -p anki-cluster
    
    # Delete cluster
    minikube delete -p anki-cluster

### Set up cluster

    minikube start \
        --driver=virtualbox \
        --cpus=2 \
        --memory=2gb \
        --disk-size=10gb \
        --insecure-registry "192.168.99.0/24" \
        -p anki-cluster
        
    minikube addons enable registry -p anki-cluster
    
    # Add ip to docker insecure-registries
    echo "{\"insecure-registries\" : [\"$(minikube ip -p anki-cluster):5000\"]}" | sudo tee /etc/docker/daemon.json > /dev/null
    sudo systemctl restart docker
    
### Minikube Registry

    docker tag ankid-369837507:latest $(minikube ip -p anki-cluster):5000/ankid-369837507:latest \
    ; docker tag ankid-339253577:latest $(minikube ip -p anki-cluster):5000/ankid-339253577:latest \
    : docker tag anki-builder:latest $(minikube ip -p anki-cluster):5000/anki-builder:latest
    
    docker push $(minikube ip -p anki-cluster):5000/ankid-369837507:latest \
    ; docker push $(minikube ip -p anki-cluster):5000/ankid-339253577:latest \
    ; docker push $(minikube ip -p anki-cluster):5000/anki-builder:latest
    
    # Pull images into minikube
    eval $(minikube docker-env -p anki-cluster)
    
    docker pull $(minikube ip -p anki-cluster):5000/ankid-369837507:latest \
    ; docker pull $(minikube ip -p anki-cluster):5000/ankid-339253577:latest \
    ; docker pull $(minikube ip -p anki-cluster):5000/anki-builder:latest
    
    eval $(minikube docker-env -p anki-cluster -u)
    
### Kubectl

    INSECURE_REGISTRY_IP=$(minikube ip -p anki-cluster) envsubst < deployment-minikube.yml | kubectl apply -f secret.yml -f -
    kubectl delete -f secret.yml -f deployment-minikube.yml
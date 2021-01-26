## Minikube

https://minikube.sigs.k8s.io/docs/handbook/pushing/  

### Usage

    minikube profile list
    minikube status -p anki-docker-cluster

    minikube start -p anki-docker-cluster
    minikube stop -p anki-docker-cluster
    
    # Delete cluster
    minikube delete -p anki-docker-cluster
    
    # Dashboard
    minikube dashboard -p anki-docker-cluster

### Set up cluster

    minikube start \
        --driver=docker \
        --cpus=4 \
        --memory=2gb \
        --disk-size=8gb \
        --insecure-registry "192.168.0.0/16" \
        -p anki-docker-cluster
        
    minikube addons enable registry -p anki-docker-cluster
    
    # Add ip to docker insecure-registries
    echo "{\"insecure-registries\" : [\"$(minikube ip -p anki-docker-cluster):5000\"]}" | sudo tee /etc/docker/daemon.json > /dev/null
    sudo systemctl restart docker
    minikube start -p anki-docker-cluster
    
### Minikube Registry

    docker tag anki-builder:latest $(minikube ip -p anki-docker-cluster):5000/anki-builder:latest \
    ; docker tag ankid-369837507:latest $(minikube ip -p anki-docker-cluster):5000/ankid-369837507:latest \
    ; docker tag ankid-339253577:latest $(minikube ip -p anki-docker-cluster):5000/ankid-339253577:latest
    
    docker push $(minikube ip -p anki-docker-cluster):5000/anki-builder:latest \
    ; docker push $(minikube ip -p anki-docker-cluster):5000/ankid-369837507:latest \
    ; docker push $(minikube ip -p anki-docker-cluster):5000/ankid-339253577:latest
    
    # Pull images in minikube
    eval $(minikube docker-env -p anki-docker-cluster) \
    ; docker pull $(minikube ip -p anki-docker-cluster):5000/anki-builder:latest \
    ; docker pull $(minikube ip -p anki-docker-cluster):5000/ankid-369837507:latest \
    ; docker pull $(minikube ip -p anki-docker-cluster):5000/ankid-339253577:latest \
    ; eval $(minikube docker-env -p anki-docker-cluster -u)
    
### Kubectl

    # Apply
    INSECURE_REGISTRY_IP=$(minikube ip -p anki-docker-cluster) envsubst < deployment-minikube.yml | kubectl apply -f secret.yml -f -
    
    # Delete
    kubectl delete -f secret.yml -f deployment-minikube.yml
    
### Autostart

/etc/systemd/system/anki-docker-cluster.service

    [Unit]
    Description=Run anki-docker-cluster
    After=docker.service
    
    [Service]
    Type=oneshot
    RemainAfterExit=true
    User=achuhlomin
    ExecStart=minikube start -p anki-docker-cluster
    
    [Install]
    WantedBy=docker.service

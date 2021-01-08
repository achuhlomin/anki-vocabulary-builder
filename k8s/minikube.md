## Minikube

https://minikube.sigs.k8s.io/docs/handbook/pushing/  

### Usage

    minikube profile list
    minikube status -p anki-cluster

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
        --insecure-registry "192.168.99.1/24" \
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
    
### Systemd/virtualbox/lightdm/i3exit

/bin/minikube-anki-resume

    #!/bin/sh
    
    if [ "$EUID" -ne 0 ]; then
        VBoxManage controlvm anki-cluster resume;
    else
        su -s /bin/VBoxManage achuhlomin controlvm anki-cluster resume
    fi
    
    exit 0
    
/bin/minikube-anki-pause

    #!/bin/sh
    
    if [ "$EUID" -ne 0 ]; then
        VBoxManage controlvm anki-cluster pause;
    else
        su -s /bin/VBoxManage achuhlomin controlvm anki-cluster pause
    fi
    
    exit 0

/etc/systemd/system/minikube-anki-resume.service

    [Unit]
    Description=Resume minikube vm for anki-cluster profile
    After=suspend.target
    After=hibernate.target
    After=hybrid-sleep.target
    After=suspend-then-hibernate.target
    
    [Service]
    User=achuhlomin
    ExecStart=/bin/minikube-anki-resume
    
    [Install]
    WantedBy=multi-user.target
    WantedBy=suspend.target
    WantedBy=hibernate.target
    WantedBy=hybrid-sleep.target
    WantedBy=suspend-then-hibernate.target
    
/bin/i3exit (notice /bin/minikube-anki-pause)

    #!/bin/sh
    # /usr/bin/i3exit
    
    # with openrc use loginctl
    [ "$(cat /proc/1/comm)" = "systemd" ] && logind=systemctl || logind=loginctl
    
    case "$1" in
        lock)
            blurlock
    	#dm-tool lock
            ;;
        logout)
            i3-msg exit
            ;;
        switch_user)
            /bin/minikube-anki-pause ; dm-tool switch-to-greeter
            ;;
        suspend)
            /bin/minikube-anki-pause ; $logind suspend-then-hibernate
            ;;
        hibernate)
            /bin/minikube-anki-pause ; $logind hibernate
            ;;
        reboot)
            $logind reboot
            ;;
        shutdown)
            $logind poweroff
            ;;
        *)
            echo "== ! i3exit: missing or invalid argument ! =="
            echo "Try again with: lock | logout | switch_user | suspend | hibernate | reboot | shutdown"
            exit 2
    esac
    
    exit 0

/etc/lightdm/lightdm.conf

    ...
    display-setup-script=/bin/minikube-anki-resume
    ...

# Go Painting Web Application

This is a simple website written in Golang. It uses the `net/http` package to serve HTTP requests.

## Running the application

To run the server, execute the following command:

```bash
go run main.go
```

The server will start on port 8080. You can access it by navigating to `http://localhost:8080/canvas` in your web browser.

## Starting project with binary

First, we need to build by executing this command:

```bash
go build -o main .
```
Then, running a binary by execute this command:

```bash
./main
```
<br>

## Step by step devopsified a simple go applications.
The first things we need to create a cluster, In this example we create cluster without nodegroup:

```
eksctl create cluster \
--name go-cluster \
--region ap-southeast-1 \
--without-nodegroup
```
if want to delete cluster:
```
eksctl delete nodegroup \
--cluster go-cluster \
--name ng-al2 \
--region ap-southeast-1
```
After we created a cluster, now we can create a nodegroup with config and run this command:
```
eksctl create nodegroup -f nodegroup.yaml
```
And to verify nodegroup cluster:
```
eksctl get nodegroup --cluster=go-cluster
```
<br>
Next, after we writting k8s manifest, we can go apply:

```
kubectl apply -f deployment.yaml
```
```
kubectl apply -f service.yaml
```
```
kubectl apply -f ingress.yaml
```
After we apply all manifest things, Edit a service:
```
kubectl edit svc go-paint-app
```
Inside of edit mode we can change type of service from ```ClusterIP``` to ```NodePort``` and save it.
And then let see the ports in our service, in this project:
```
PORT (S)
80:32370/TCP
```
Also check our nodes external ip for test our app in this project:
```
kubectl get nodes -o wide

EXTERNAL-IP
13.213.37.99
```
And don't forget to open spesific port range```32370```, Custom TCP, CIDR Block ```0.0.0.0/0``` inbound rules in our ec2 instances security group.

After that we can access our app with ```external-ip:port``` for example ```13.213.37.92:32370```
<br><br>
Next, we're not finished yet! Now apply our ingress controller config:
```
kubectl apply -f nginx-ingress-contoller.yaml
or
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.1/deploy/static/provider/aws/deploy.yaml
```
<br><br>
To verify ingress controller was running in our cluster:
```
kubectl get all -n ingress-nginx
```
And now we have address in our ingress but we can't access because we just want to check ip address in our ingress address by running this command:
```
nslookup <addressingress.com>
for example:
nslookup a00bf46dc46984e6c8428c9c92698901-01f25ddae3a2640a.elb.ap-southeast-1.amazonaws.com
```
And we can see the output has a couple ip address which we'll choose now.
```
for example:
Server:         8.8.8.8
Address:        8.8.8.8#53

Non-authoritative answer:
Name:   a00bf46dc46984e6c8428c9c92698901-01f25ddae3a2640a.elb.ap-southeast-1.amazonaws.com
Address: 52.221.38.120
Name:   a00bf46dc46984e6c8428c9c92698901-01f25ddae3a2640a.elb.ap-southeast-1.amazonaws.com
Address: 3.1.34.138
Name:   a00bf46dc46984e6c8428c9c92698901-01f25ddae3a2640a.elb.ap-southeast-1.amazonaws.com
Address: 13.215.53.16
```
We pick one of the 3 ip, in above that is ```3.1.34.138```.

After that we can add in our /etc/hosts by running this command:
```
sudo vi /etc/hosts
```
And add our ip to /etc/hosts with assigning ip to host in our ingress config:
```
##

127.0.0.1 localhost
255.255.255.255 broadcasthost
::1 localhost

3.1.34.138 go-paint-app.local
```
After that we can access our app instead of using address in ingress, we can access by running ```go-paint-app.local``` in our browser.


<br>

## Helm

Next things is using Helm.
To verify helm was intalled on machine:

```
helm version
```
Create a new folder name helm, and inside of helm directory run this command:
```
helm create go-paint-app-chart
```
Next delete /charts folder, and change dir to /templates and delete everything inside of templates folder.

Copy all of config inside of ```/k8s/manifest/``` ```deployment.yaml```, ```service.yaml```, ```ingress.yaml```.

Go ahead, edit a tag with replaced by variable in deployment.yaml, from this:
```
image: etheriannn/go-webapp:v1
```
to this:
```
etheriannn/go-webapp:{{ .Values.image.tag }}
```

Replace contents of values.yaml with this code, reference from ```https://github.com/iam-veeramalla/go-web-app-devops/blob/main/helm/go-web-app-chart/values.yaml```:
```
# Default values for go-web-app-chart.
# This is a YAML-formatted file.
# Declare variables to be passed into your templates.

replicaCount: 1

image:
  repository: etheriannn/go-web-app
  pullPolicy: IfNotPresent
  # Overrides the image tag whose default is the chart appVersion.
  tag: "v1"

ingress:
  enabled: false
  className: ""
  annotations: {}
    # kubernetes.io/ingress.class: nginx
    # kubernetes.io/tls-acme: "true"
  hosts:
  - host: chart-example.local
    paths:
    - path: /
      pathType: ImplementationSpecific

```
Then, delete all the service which we implemented and running before such as deployment, service, ingress:
```
kubectl delete deploy go-paint-app
kubectl delete svc go-paint-app
kubectl delete ing go-paint-app
```

Change dir to helm dir above go-web-app-chart is /helm and run:
```
helm install go-paint-app ./go-paint-app-chart
```
And this for uninstall go-paint-app service a whole things with single command:
```
helm uninstall go-paint-app 
```

## CI & CD
We'll use Github actions for CI, and Gitops/ArgoCd for CD.

In our project dir, create a folder ./github/workflows/, and create a file with cicd.yaml, whatever u name it. and fill with this code:
``` cicd.yaml
# CICD using GitHub actions

name: CI/CD

# Exclude the workflow to run on changes to the helm chart
on:
  push:
    branches:
      - main
    paths-ignore:
      - "helm/**"
      - "k8s/**"
      - "README.md"

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Go 1.22
        uses: actions/setup-go@v2
        with:
          go-version: 1.22

      - name: Build
        run: go build -o go-web-app

      - name: Test
        run: go test ./...

  code-quality:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Go 1.22
        uses: actions/setup-go@v2
        with:
          go-version: 1.22

      - name: Run golangci-lint
        uses: golangci/golangci-lint-action@v6
        with:
          version: v1.56.2

  push:
    runs-on: ubuntu-latest

    needs: build

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v1

      - name: Login to DockerHub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and Push action
        uses: docker/build-push-action@v6
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/go-web-app:${{github.run_id}}

  update-newtag-in-helm-chart:
    runs-on: ubuntu-latest

    needs: push

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.TOKEN }}

      - name: Update tag in Helm chart
        run: |
          sed -i 's/tag: .*/tag: "${{github.run_id}}"/' helm/go-paint-app-chart/values.yaml

      - name: Commit and push changes
        run: |
          git config --global user.email "rianziwalker@gmail.com"
          git config --global user.name "etherian3"
          git add helm/go-paint-app-chart/values.yaml
          git commit -m "Update tag in Helm chart"
          git push

```
After that, create a secrets key on repo/settings/secrets/actions/new, and fill the var with secrets.
```
name: DOCKERHUB_USERNAME
secrets: etheriannn

name: DOCKERHUB_TOKEN
secrets: sample123

name: TOKEN
secrets: githubtokensample12312
```

After we trigger Github Actions, we can check docker images tag in registry, values.yaml.

Now We're gonna implementing Argo CD.

First, we need to install Argo CD and create namespace argocd:
```
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```
Next
```
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'
Verify:
kubectl get svc -n argocd
```
We can see ports tcp ```30398```:
```
80:30398/TCP,443:32633/TCP
```
Then see the external-ip nodes argocd ```13.213.37.99```:
```
kubectl get nodes -o wide
```
Before you access argocd, make sure tcp port allows you to access it.
Open NodePort in your Security Group node:
1.	AWS Console → EC2 → Security Groups
2.	Find your SG cluster, and add your ports allow. <br>
And try to access it within our browser with external-ip:port.


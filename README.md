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






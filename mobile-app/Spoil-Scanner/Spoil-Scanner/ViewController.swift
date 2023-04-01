//
//  ViewController.swift
//  Spoil-Scanner
//
//  Created by Lucas Camerlingo on 3/31/23.
//
import SwiftUI
import UIKit

var food_name: [String] = []
var foods: [Food] = []
struct Food: Codable {
    //let key: String
    let expirationDates: [String]
    let imageLink: String

    enum CodingKeys: String, CodingKey {
        case key
        case expirationDates = "expiration_dates"
        case imageLink = "image_link"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        //key = try container.decode(String.self, forKey: .key)
        expirationDates = try container.decode([String].self, forKey: .expirationDates)
        imageLink = try container.decode(String.self, forKey: .imageLink)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        //try container.encode(key, forKey: .key)
        try container.encode(expirationDates, forKey: .expirationDates)
        try container.encode(imageLink, forKey: .imageLink)
    }
}


class ViewController: UIViewController, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
    
    var imageStore: UIImage?
    
    
    
    @IBOutlet weak var button: UIButton!
    
    @IBAction func cameraButton(_ sender: Any) {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.allowsEditing = true
        picker.delegate = self
        present(picker, animated: true)
        guard let image = imageStore else {
            print("No image selected")
            return
        }
        sendImageToBackend(image)
        print("sent")
        
    }
    
    func imagePickerController( picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
        imageStore = info[UIImagePickerController.InfoKey.editedImage] as? UIImage
        picker.dismiss(animated: true, completion: nil)
        print("Image Stored")
    }
    
    func sendImageToBackend(_ image: UIImage) {
            // Convert image to compressed JPEG data
            guard let imageData = image.jpegData(compressionQuality: 0.1) else {
                print("Unable to convert image to data format")
                return
            }
            let base64String = imageData.base64EncodedString(options: [])

            // Create the URL components
            var urlComponents = URLComponents()
            urlComponents.scheme = "http"
            urlComponents.host = "10.35.125.219"
            urlComponents.port = 3000
            urlComponents.path = "/submitReceipt"
            
            let queryItems = [
                URLQueryItem(name: "user_id", value: "Vincent_Tren"),
            ]

            // Add the query items to the URL components
            urlComponents.queryItems = queryItems

            // Create the URL request
            guard let url = urlComponents.url else { fatalError("Could not create URL from components") }
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let jsonBody: [String: Any] = [
                "image_data": base64String
            ]
            
            

            guard let httpBody = try? JSONSerialization.data(withJSONObject: jsonBody, options: []) else {
                fatalError("Could not create request body")
            }
            request.httpBody = httpBody

            let session = URLSession.shared
            let task = session.dataTask(with: request) { data, response, error in
                if let error = error {
                    print("Error: \(error.localizedDescription)")
                    return
                }
                guard let data = data else {
                    print("No data returned")
                    return
                }
                print("Response: \(String(data: data, encoding: .utf8) ?? "")")
            }
            task.resume()
            print("sent")
        }

//        @IBAction func addButton(_ sender: Any) {
//            guard let image = imageStore else {
//                print("No image selected")
//                return
//            }
//            sendImageToBackend(image)
//        }

    
    
    let collectionView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        layout.sectionInset = .zero
        layout.itemSize = CGSize(width:320, height:100)
        layout.minimumInteritemSpacing = 1
        layout.minimumLineSpacing = 1
        let collectionView = UICollectionView(frame:.zero, collectionViewLayout:layout)
        collectionView.backgroundColor = .systemBackground
        collectionView.register(UICollectionViewCell.self,forCellWithReuseIdentifier: "cell")
        collectionView.translatesAutoresizingMaskIntoConstraints = false
        //collectionView.backgroundColor = .yellow
        return collectionView
    }()
    


    override func viewDidLoad()  {
        super.viewDidLoad()
        
        
        //print(getJSONData(from: "./people"))
        let url = URL(string: "http://10.35.125.219:3000/getItems?user_id=vincent_tren")!
             getJSONData(from: url) { foods in
                if let foods = foods {
                    //print("test")
                    var i = 0
                    for food in foods {
                        for expirationDate in food.expirationDates{
                            print("\(food_name[i]) expires at \(expirationDate)")
                        }
                        i += 1
                    }
                    print(food_name)
                    DispatchQueue.main.async {
                                    self.collectionView.reloadData()
                                }
                }
                
            }
        //print(food_name)
        view.addSubview(collectionView)
        NSLayoutConstraint.activate([
                collectionView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
                collectionView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
                collectionView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
                collectionView.bottomAnchor.constraint(equalTo: button.topAnchor),
        ])
            // Do any additional setup after loading the view
        collectionView.delegate = self
        collectionView.dataSource = self
        //print(food_name)
        
        //print(food_name)
    }
    
    func getJSONData(from url: URL, completion: @escaping  ([Food]?) -> Void)  {

        URLSession.shared.dataTask(with: url) { data, response, error in
            guard let data = data else {
                completion(nil)
                return
            }
            
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            do {
                let json = try JSONSerialization.jsonObject(with: data, options: [])
                guard let dict = json as? [String: Any] else {
                    completion(nil)
                    return
                }
                //print(dict.keys)
                
//                for key in dict.keys{
//                    print(dict[key])
//                }
                
                
//                for key in dict.keys{]
//                    guard let result = dict[key] as? [String:Any]
//                            let exp = result["expiration_dates"] as! String
//                    print(exp)
//               }
                for (_, value) in dict {
                    let data = try JSONSerialization.data(withJSONObject: value, options: [])
                    
                    let food = try decoder.decode(Food.self, from: data)
                    foods.append(food)
                    
                    //print(foods)
                }
                
                for key in dict.keys{
                    food_name.append(key)
                }
                print(food_name)
                
                
                completion(foods)
            } catch {
                print("Error decoding JSON: \(error)")
                completion(nil)
            }
        }.resume()
    }

    
        
    
   
    
    
    
}

extension ViewController: UICollectionViewDelegate, UICollectionViewDataSource {
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return food_name.count
    }
    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let food = foods[indexPath.item]
        //print(food_name)
        print(food.imageLink)
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: "cell", for: indexPath)
        if #available(iOS 16, *){
            cell.contentConfiguration = UIHostingConfiguration {
                HStack(spacing: 60) {
                    AsyncImage(url: URL(string: "food.imageLink")){ image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                    } placeholder: {
                        Color.gray
                    }
                    .frame(width: 100, height: 100)
                
                
                    VStack {
                        Text(food_name[indexPath.row]).font(.system(size:16)).lineLimit(1)
                        Text(food.expirationDates[0]).font(.system(size:10)).lineLimit(1)
                        
                    }
                    //.padding()
                    //Spacer()
                }
            }
        }
        
        return cell
    }
}


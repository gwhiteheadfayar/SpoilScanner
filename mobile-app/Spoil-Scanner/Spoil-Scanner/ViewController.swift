//
//  ViewController.swift
//  Spoil-Scanner
//
//  Created by Lucas Camerlingo on 3/31/23.
//
import SwiftUI
import UIKit


struct Person: Codable {
    let name: String
    let age: Int
}


class ViewController: UIViewController {
    
    @IBOutlet weak var button: UIButton!
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

    override func viewDidLoad() {
        super.viewDidLoad()
        
        //print(getJSONData(from: "./people"))
        if let people = getJSONData(from: "people") {
                    for person in people {
                        print("\(person.name) is \(person.age) years old.")
                    }
                }
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
    }
    
    func getJSONData(from fileName: String) -> [Person]? {
            
            guard let url = Bundle.main.url(forResource: fileName, withExtension: "json"),
                  let data = try? Data(contentsOf: url) else {
                return nil
            }
            
            
            let decoder = JSONDecoder()
            let people = try? decoder.decode([Person].self, from: data)
            return people
        }
    
        
    
   
    
    
    
}

extension ViewController: UICollectionViewDelegate, UICollectionViewDataSource {
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return 10
    }
    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: "cell", for: indexPath)
        if #available(iOS 16, *){
            cell.contentConfiguration = UIHostingConfiguration {
                HStack(spacing: 60) {
                    Image(systemName: "star")
                    VStack {
                        Text("Food").font(.title)
                        Text("Expiration Date").font(.body)
                    }
                    .padding()
                    Spacer()
                }
            }
        }
        
        return cell
    }
}


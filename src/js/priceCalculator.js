import * as utils from "./utils";
import * as THREE from 'three';

const currencySymbol = '₽';


export function calculatePrice(objects){
    let price = 0;
    for(let obj of objects){
        if(obj.userData.isWall || obj.userData.isCorner) continue
        utils.applyToMeshes(obj, (m)=>{
            const priceCoeff = getMaterialCoefficient(m.material);
            const size = utils.getBox3Size(new THREE.Box3().setFromObject(m));
            price += (size.x + size.y + size.z) * 1000 * priceCoeff;
        });
    }
    updatePriceLabel(price);
    return price;
}
function updatePriceLabel(price){
    const priceLabel = document.querySelector('#price');
    priceLabel.textContent = parseFloat(price).toFixed(2) + currencySymbol;
}
function getMaterialCoefficient(material){
    if(!material.userData || !material.userData.priceCoeff) return 0;
    return material.userData.priceCoeff;
}
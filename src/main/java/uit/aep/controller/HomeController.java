package uit.aep.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import uit.aep.model.MTree;

import java.time.LocalDate;

/**
 * Created by Bean on 20-Jul-17.
 */
@Controller
public class HomeController
{

    @RequestMapping("/")
    public String home(){
        return "homePage";
    }

    @RequestMapping("/initialImport")
    public String importData(){
        MTree mtree = new MTree("Topic Evolution");
        mtree.createTree(LocalDate.of(2017, 5, 30), 12);
        return "homePage";
    }
}
